export default class L5rWeaponSheet extends ItemSheet {
   /** @override */
   static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
         classes: ["l5r4ec", "sheet", "item"],
         template: CONFIG.l5r4ec.paths.templates + "items/weapons/weapon-sheet.hbs",
         width: 520,
         height: 480,
         tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      });
   }
   async getData(options = {}) {
      const baseData = await super.getData(options);
      let sheetData = {
         owner: this.item.isOwner,
         editable: this.isEditable,
         item: baseData.item,
         data: baseData.item.system,
         config: CONFIG.l5r4ec,
      };

      // Martial skills only
      sheetData.data.skills = Array.from(CONFIG.l5r4ec.skills).map(([id]) => id);
      console.log(sheetData);

      return sheetData;
   }
}
