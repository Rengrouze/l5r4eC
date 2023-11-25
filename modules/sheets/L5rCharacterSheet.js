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

      sheetData.data.clans = Array.from(CONFIG.l5r4ec.clans).map(([id]) => id);
      // console.log the selected clan
      console.log(sheetData.data.clan);

      await this._updateRingLevels(sheetData.data.rings, sheetData.data.traits);
      await this._updateArmorTn(sheetData.data);

      await this._updateReputation(sheetData.data.rings, sheetData.data.skills, sheetData.data.insight);
      await this._updateInsight(sheetData.data.insight);
      console.log(sheetData.data);
      return sheetData;
   }

   async _updateRingLevels(rings, traits) {
      // Obtient les niveaux de tous les traits associés aux anneaux

      const traitLevels = {
         water: Math.min(traits.strength, traits.perception),
         earth: Math.min(traits.stamina, traits.willpower),
         fire: Math.min(traits.agility, traits.intelligence),
         air: Math.min(traits.awareness, traits.reflexes),
      };

      // Met à jour les niveaux des anneaux en fonction des niveaux des traits associés
      for (const [ring] of Object.entries(rings)) {
         // Vérifie si l'anneau n'est pas "void" avant de mettre à jour
         if (ring !== "void") {
            rings[ring] = traitLevels[ring];
         }
      }
   }
   async _updateArmorTn(data) {
      // Calculer la TN de l'armure
      data.armor.natural = data.traits.reflexes * 5;
      // add armor TN to base TN
      data.armor.current = data.armor.natural + data.armor.armorMod + data.armor.otherMod;

      // Ajouter la TN de l'armure à la TN de base
   }
   async _updateReputation(rings, skills, reputation) {
      //
      reputation.points = 0;

      // Calculer les niveaux d'anneaux
      for (const [ring] of Object.entries(rings)) {
         reputation.points += rings[ring] * 10;
      }

      // Parcourir les compétences et ajouter les niveaux de compétence
      const skillCategories = ["high", "bugei", "low", "merchant", "weapon"];
      for (const category of skillCategories) {
         for (const [skill] of Object.entries(skills[category])) {
            reputation.points += skills[category][skill];
         }
      }

      console.log(reputation.points);
   }

   async _updateInsight(insight) {
      insight.rank = 0;
      if (insight.points >= 1 && insight.points <= 149) {
         insight.rank = 1;
      } else if (insight.points >= 150 && insight.points <= 174) {
         insight.rank = 2;
      } else if (insight.points >= 175 && insight.points <= 199) {
         insight.rank = 3;
      } else if (insight.points >= 200 && insight.points <= 224) {
         insight.rank = 4;
      } else if (insight.points >= 225 && insight.points <= 249) {
         insight.rank = 5;
      } else if (insight.points >= 250 && insight.points <= 274) {
         insight.rank = 6;
      } else if (insight.points >= 275 && insight.points <= 299) {
         insight.rank = 7;
      } else {
         // Calculer le rang supplémentaire pour chaque tranche de 25 points au-dessus de 300
         const additionalRanks = Math.floor((reputation - 300) / 25);
         insight.rank = 8 + additionalRanks;
      }
      console.log(insight);
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
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,

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
