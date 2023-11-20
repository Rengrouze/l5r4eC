export const RegisterHandlebars = function () {
   const sanitizeIfFail = (str) => {
      return str.indexOf("l5r4ec.") !== -1 && str.indexOf("undefined") ? "" : str;
   };

   Handlebars.registerHelper("localizeSkill", function (categoryId, skillId) {
      const key = "l5r4ec.skills." + categoryId.toLowerCase() + "." + skillId.toLowerCase();
      return sanitizeIfFail(game.i18n.localize(key));
   });

   Handlebars.registerHelper("localizeSkillId", function (skillId) {
      const key = "l5r4ec.skills." + CONFIG.l5r4ec.skills.get(skillId.toLowerCase()) + "." + skillId.toLowerCase();
      console.log(key);
      console.log(game.i18n.localize(key));
      return sanitizeIfFail(game.i18n.localize(key));
   });
   Handlebars.registerHelper("localizeRing", function (ringId) {
      const key = "l5r4ec.rings." + ringId.toLowerCase();
      return sanitizeIfFail(game.i18n.localize(key));
   });
};
