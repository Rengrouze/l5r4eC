import L5rItemSheet from "./modules/sheets/l5rItemSheet.js";

Hooks.once("init", function () {
   console.log("l5r4ec | initialisation du mod spécial Cyrus");
   Items.unregisterSheet("core", ItemSheet);
   Items.registerSheet("L5r Item", L5rItemSheet, { makeDefault: true });
});
