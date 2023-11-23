export default class L5rCharacterSheet extends ActorSheet {
   /** @override */
   static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
         classes: ["l5r4ec", "sheet", "actor"],
         template: CONFIG.l5r4ec.paths.templates + "actors/characters/character-sheet.hbs",
         width: 820,
         height: 780,
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

      await this._updateRingLevels(sheetData.data.rings, sheetData.data.traits);
      console.log(sheetData);
      console.log(sheetData.data.rings.air);
      console.log(sheetData.data.rings.earth);
      console.log(sheetData.data.rings.fire);
      console.log(sheetData.data.rings.water);
      console.log(sheetData.data.rings.void);
      return sheetData;
   }

   async _updateRingLevels(rings, traits) {
      // Obtient les niveaux de tous les traits associés aux anneaux

      console.log(traits);
      const traitLevels = {
         water: Math.min(traits.strength, traits.perception),
         earth: Math.min(traits.stamina, traits.willpower),
         fire: Math.min(traits.agility, traits.intelligence),
         air: Math.min(traits.awareness, traits.reflexes),
      };
      console.log(traitLevels);

      // Met à jour les niveaux des anneaux en fonction des niveaux des traits associés
      for (const [ring] of Object.entries(rings)) {
         // Vérifie si l'anneau n'est pas "void" avant de mettre à jour
         if (ring !== "void") {
            rings[ring] = traitLevels[ring];
         }
      }
   }

   activateListeners(html) {
      super.activateListeners(html);

      // Écouteur d'événement pour les boutons de jet de dés
      html.find(".roll-dice").click((event) => this._onRollDice(event));
   }

   async _onRollDice(event) {
      console.log(event.currentTarget.dataset);
      const rollType = event.currentTarget.dataset.rollType;
      const stat = event.currentTarget.dataset.name;

      const statValue = event.currentTarget.dataset.value;

      let rollResult; // Déclarer rollResult en dehors des conditions
      let keep; // Déclarer keep ici

      if (rollType === "trait") {
         // Recherche du niveau de trait dans les données
         const traitLevel = parseInt(statValue); // Assurez-vous de convertir en nombre

         // Définir les valeurs de jet et de conservation
         let roll = traitLevel;
         keep = traitLevel; // Définir keep ici

         // Effectuer le jet de dés
         rollResult = await this._rollDice(roll, keep);
      } else if (rollType === "ring") {
         const ringLevel = this.actor.system.rings[stat]; // Utiliser 'rings' au lieu de 'ring'
         let roll = ringLevel;
         keep = ringLevel; // Définir keep ici

         // Effectuer le jet de dés
         rollResult = await this._rollDice(roll, keep);
      } else if (rollType === "skill") {
         const skillLevel = this.actor.system.skills[stat];
         const traitLevel = 5;
         let roll = skillLevel + traitLevel;

         if (roll > 10) {
            surplus = roll - 10;
            roll = 10;
            console.log(surplus);
         }

         // Effectuer le jet de dés
         rollResult = await this._rollDice(roll, keep); // Ajouter 'keep' ici
      } else {
         // Si le type de jet de dés n'est pas défini comme prévu
         console.error("Le type de jet de dés n'est pas défini comme prévu.");
      }

      // Afficher le résultat du jet dans la console
      console.log("Roll Result:", rollResult);

      // Afficher le résultat du jet dans l'interface utilisateur
      this._displayRollResult(stat, rollResult, keep);
   }

   async _rollDice(roll, keep) {
      const rollResult = await this._rollAndKeepDice(roll, keep);

      return rollResult;
   }

   async _rollAndKeepDice(roll, keep) {
      const rollFormula = `${roll}d10kh${keep}`;

      const rollResult = await new Roll(rollFormula).evaluate({ async: true });

      // Initialise la liste des résultats formatés
      const formattedResults = [];

      // Parcours les résultats du jet
      for (const result of rollResult.dice[0].results) {
         let displayResult = result.result;

         if (result.result === 10) {
            // Relance le dé de 10 jusqu'à ce qu'il n'explose plus
            do {
               const additionalRoll = await new Roll("1d10").evaluate({ async: true });
               if (additionalRoll && additionalRoll.dice && additionalRoll.dice.length > 0) {
                  const additionalResult = additionalRoll.total;

                  // Ajoute le résultat de la relance à la somme
                  displayResult += additionalResult;

                  console.log(`Relance pour le dé de 10 : ${additionalResult}`);

                  // Continue la cascade si la relance est un 10
               } else {
                  console.error("Les résultats de la relance du dé de 10 ne sont pas définis comme prévu.");
                  break;
               }
            } while (displayResult % 10 === 0); // Continue la boucle jusqu'à ce que la relance ne soit pas un 10
         }

         // Ajoute le résultat dans la liste
         formattedResults.push(displayResult);
      }

      // Calcule la somme totale
      const total = formattedResults.reduce((sum, result) => sum + result, 0);

      return {
         total: total,
         diceResults: formattedResults,
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

   _formatDetailedResults(diceResults) {
      // Vérifie si les résultats du jet sont définis
      if (diceResults && diceResults.length > 0) {
         // Formate les résultats détaillés avec des couleurs pour les dés explosés
         const formattedResults = diceResults
            .map((result) => {
               let textColor = "";
               let displayResult = result;

               if (result >= 10) {
                  textColor = "green";
               } else if (result === 1) {
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
