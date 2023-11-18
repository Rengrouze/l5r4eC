export default class L5rItemSheet extends ItemSheet {
   get template() {
      return `systems/l5r4ec/templates/sheets/${this.item.data.type}-sheet.html`;
   }
}
