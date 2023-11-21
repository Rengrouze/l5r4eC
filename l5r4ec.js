console.log("trying to import module");
import { l5r4ec } from "./modules/sheets/config.js";
console.log("module 1 ok");
import L5rWeaponSheet from "./modules/sheets/L5rWeaponSheet.js";
console.log("module 2 ok");
import L5rCharacterSheet from "./modules/sheets/L5rCharacterSheet.js";
import { RegisterHandlebars } from "./handlebars.js";
console.log("module 3 ok");

Hooks.once("init", function () {
   console.log("l5r4ec | initialisation du mod spécial Cyrus");
   console.log("l5r4ec | initialisation du mod spécial Cyrus");
   console.log("l5r4ec | initialisation du mod spécial Cyrus");
   console.log("l5r4ec | initialisation du mod spécial Cyrus");
   console.log("l5r4ec | initialisation du mod spécial Cyrus");
   console.log("l5r4ec | initialisation du mod spécial Cyrus");

   CONFIG.l5r4ec = l5r4ec;

   Items.unregisterSheet("core", ItemSheet);
   Items.registerSheet("L5r Item", L5rWeaponSheet, { makeDefault: true });
   // Items.registerSheet("L5r Item", L5rWeaponSheet);
   Actors.unregisterSheet("core", ActorSheet);
   Actors.registerSheet("L5r Actor", L5rCharacterSheet);
   RegisterHandlebars();
});
