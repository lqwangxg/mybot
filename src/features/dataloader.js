'use strict';
const fs = require("fs");
const yaml = require('js-yaml');

const buildPath = require("path");
const dataPath = buildPath.join(__dirname, "data");

function loadYamlFile(filename) {
  const yamlText = fs.readFileSync(filename, 'utf8')
  return yaml.safeLoad(yamlText);
}

module.exports = async function(controller) {

  //for saving global parameters.
  if(!controller.myVariables){
    controller.myVariables = {};
  }

  //====================================================
  fs.readdirSync(dataPath).forEach((file) => {
    let filePath = buildPath.join(dataPath, file);
    console.log("filePath:", filePath);
    let data = loadYamlFile(filePath);
    console.log(data);

    hearWhat(controller, data);
  
  });
  //====================================================
  
  //====================================================
  async function hearWhat(controller, data){
    if("hears" != data.type || !data.script){
      return;
    }
    
    if(Array.isArray(data.script)){
      data.script.forEach(script=> hearAction(controller, script));
    }else{
      hearAction(controller, data.script)
    }
  }
  async function hearAction(controller, script){
    script.keywords = toRegexObject(script.keywords);
    controller.hears(script.keywords, script.events, async function(bot, message) {
      console.log("hearAction: ", script);
      // if(script.required && script.required.key && script.required.dialog 
      //   && !isRequiredValid(controller, script.required.key)){
      //   console.log(" heard message:", message);
      //   controller.vars.lastMessage = {
      //     type: message.type,
      //     text: message.text,
      //     user: message.user,
      //     channel: message.channel,
      //     value: message.value,
      //     data: {text: message.data.text},
      //     user_profile: message.user_profile,
      //     reply_user: message.reply_user 
      //   };
        
      //   //Object.assign(controller.vars.lastMessage.reference, message.reference); 
      //   await bot.beginDialog(script.required.dialog);
      //   return;
      // }

      if(script.replies){
        await replyMessage(bot, message, script.replies);
      }
      if(script.dialog){
        await bot.beginDialog(script.dialog);
      }
    });


  }

  //====================================================
  //# reply Message on heard something. 
  //====================================================
  async function replyMessage(bot, message, replies){
    if(!replies){
      return;
    }

    if(typeof(replies)==="string"){
      await bot.reply(message, {
        type:"text",
        text: replies
      });
      return;
    }
    
    if(Array.isArray(replies)){
      replies.forEach(txt => {
        replyMessage(bot, message, txt)
      });
      return;
    }

    if(typeof(replies)==="object"){
      await bot.reply(message, {
        type: message.type,
        text: replies.text,
        channel: message.channel,
        touser: message.user,
        quick_replies: replies.quick_replies
      });
      return;
    }
    
  }

  //====================================================
  //# regex string to regex object  
  //====================================================
  function toRegexObject(option){
    if(!option)return option;
    
    if (typeof(option) === 'string' && option.match(/^\/(.+)\/$/)) {
      option = new RegExp(option.substring(1,option.length-1));
    }else if(option.type==="regex" && option.pattern){
      option.pattern = new RegExp(option.pattern);
    }else if (Array.isArray(option)){
      option = option.map(op => toRegexObject(op));
    }
    
    return option;
  }
  //====================================================
}
