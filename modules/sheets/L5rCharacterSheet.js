export default class L5rCharacterSheet extends ActorSheet {
   /** @override */
   static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
         classes: ["l5r4ec", "sheet", "actor"],
         template: CONFIG.l5r4ec.paths.templates + "actors/characters/character-sheet.hbs",
         width: 520,
         height: 480,
         tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      });
   }
   async getData(options = {}) {
      const baseData = await super.getData(options);
      let sheetData = {
         owner: this.actor.isOwner,
         editable: this.isEditable,
         actor: baseData.actor,
         data: baseData.actor.system,
         config: CONFIG.l5r4ec,
         items: baseData.items,
      };
      console.log(sheetData);
      console.log(sheetData.data.rings.air);
      console.log(sheetData.data.rings.earth.value);
      return sheetData;
   }

   activateListeners(html) {
      super.activateListeners(html);

      // Écouteur d'événement pour les boutons de jet de dés
      html.find(".roll-dice").click((event) => this._onRollDice(event));
   }

   async _onRollDice(event) {
      // Récupère le stat associé au bouton cliqué
      const stat = event.currentTarget.dataset.stat;

      // Récupère la valeur du stat d'anneau
      const statValue = this.actor.system.rings[stat];

      // Effectue le jet de dés et garde en utilisant l'API de Foundry VTT
      const rollResult = await this._rollAndKeepDice(statValue, statValue);

      // Affiche le résultat dans le chat
      this._displayRollResult(stat, rollResult, statValue);
   }

   async _rollAndKeepDice(roll, keep) {
      // Utilise l'API de Foundry VTT pour effectuer le jet de dés
      const rollFormula = `${roll}d10kh${keep}`;
      const rollResult = await new Roll(rollFormula).evaluate({ async: true });

      // Retourne le résultat du jet
      return rollResult;
   }

   _displayRollResult(stat, rollResult, keep) {
      // Vérifie si les résultats du jet sont définis
      if (rollResult && rollResult.terms && rollResult.terms[0] && rollResult.terms[0].results) {
         // Récupère les détails du jet
         const diceResults = rollResult.terms[0].results;

         // Compte le nombre de dés qui ont explosé
         const explodeCount = diceResults.filter((result) => result.result === 10).length;

         // Formate le message pour le chat
         const messageContent = `<b>Résultat du jet de dés pour ${stat} :</b><br>
            Dés lancés : ${rollResult.terms[0].number}<br>
            Dés gardés : ${keep}<br>
            Total : ${rollResult.total}<br>
            Dés explosés : ${explodeCount}<br>
            Résultats détaillés : ${this._formatDetailedResults(diceResults)}`;

         // Crée le message de chat
         const chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: messageContent,
         };

         // Envoie le message de chat
         ChatMessage.create(chatData, {});
      } else {
         console.error("Les résultats du jet de dés ne sont pas définis comme prévu.");
      }
   }

   _formatDetailedResults(diceResults) {
      // Formate les résultats détaillés avec des couleurs pour les dés explosés
      const formattedResults = diceResults
         .map((result) => {
            let textColor = "";
            if (result.result === 10) {
               textColor = "green";
            } else if (result.result === 1) {
               textColor = "red";
            }
            return `<span style="color:${textColor};">${result.result}</span>`;
         })
         .join(", ");

      return formattedResults;
   }
}
