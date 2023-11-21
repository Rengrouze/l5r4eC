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
      const stat = event.currentTarget.dataset.stat;
      const statValue = this.actor.system.rings[stat];
      const rollResult = await this._rollAndKeepDice(statValue, statValue);
      this._displayRollResult(stat, rollResult, statValue);
   }

   async _rollAndKeepDice(roll, keep) {
      const rollFormula = `${roll}d10kh${keep}`;
      const rollResult = await new Roll(rollFormula).evaluate({ async: true });

      let total = rollResult.dice[0].results.slice(0, keep).reduce((sum, result) => sum + result.result, 0);

      const explodedResults = [];

      const explodeCount = rollResult.dice[0].results.filter((result) => result.result === 10).length;
      for (let i = 0; i < explodeCount; i++) {
         const additionalRoll = await new Roll("1d10").evaluate({ async: true });
         if (additionalRoll && additionalRoll.dice && additionalRoll.dice.length > 0) {
            total += additionalRoll.dice[0].results[0].result;
            explodedResults.push(additionalRoll.dice[0].results[0].result);
            console.log(`Relance pour le dé de 10 : ${additionalRoll.dice[0].results[0].result}`);
         } else {
            console.error("Les résultats de la relance du dé de 10 ne sont pas définis comme prévu.");
         }
      }

      return {
         total: total,
         diceResults: rollResult.dice[0].results,
         exploded: explodedResults,
      };
   }

   _displayRollResult(stat, rollResult, keep) {
      if (rollResult && rollResult.total && rollResult.diceResults && rollResult.diceResults.length > 0) {
         const diceResults = rollResult.diceResults;
         const explodeCount = diceResults.filter((result) => result.result === 10).length;
         const detailedResults = this._formatDetailedResults(diceResults, rollResult.exploded || []);

         const messageContent = `<b>Résultat du jet de dés pour ${stat} :</b><br>
            Dés lancés : ${rollResult.diceResults.length}<br>
            Dés gardés : ${keep}<br>
            Total : ${rollResult.total}<br>
            Dés explosés : ${explodeCount}<br>
            Résultats détaillés : ${detailedResults}`;

         const chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: messageContent,
         };

         ChatMessage.create(chatData, {});
      } else {
         console.error("Les résultats du jet de dés ne sont pas définis comme prévu.");
      }
   }

   _formatDetailedResults(diceResults, explodedResults) {
      // Vérifie si les résultats du jet sont définis
      if (diceResults && diceResults.length > 0) {
         // Formate les résultats détaillés avec des couleurs pour les dés explosés
         const formattedResults = diceResults
            .map((result) => {
               let textColor = "";
               let displayResult = result.result;

               if (result.result === 10) {
                  // Stocke la valeur initiale avant la relance
                  const initialResult = result.result;

                  // Récupère le résultat de la relance
                  const additionalResult = explodedResults.shift(); // Prend le premier résultat de la liste

                  // Vérifie si le résultat de la relance est défini
                  if (additionalResult) {
                     textColor = "green";

                     // Affiche le résultat de la relance
                     displayResult = `${initialResult}+${additionalResult}`;

                     // Ajoute le résultat de la relance dans le chat
                     console.log(`Relance pour le dé de 10 : ${additionalResult}`);
                  } else {
                     console.error("Les résultats de la relance du dé de 10 ne sont pas définis comme prévu.");
                  }
               } else if (result.result === 1) {
                  textColor = "red";
               }

               return `<span style="color:${textColor};">${displayResult}</span>`;
            })
            .join(", ");

         return formattedResults;
      } else {
         console.error("Les résultats du jet de dés ne sont pas définis comme prévu.");
         return ""; // Retourne une chaîne vide en cas d'erreur
      }
   }
}
