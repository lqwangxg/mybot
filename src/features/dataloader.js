'use strict';
const fs = require("fs");
const yaml = require('js-yaml');

const buildPath = require("path");
const dataPath = buildPath.join(__dirname, "data");
const { BotkitConversation } = require("botkit");

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

    initDialog(controller, data);
    initOnHandler(controller, data);
    initHearHander(controller, data);
  
  });
  //====================================================
  // # on event happened, run...
  //====================================================
  async function initOnHandler(controller, data){
    if("on" != data.type || !data.script){
      return;
    }

    if(Array.isArray(data.script)){
      data.script.forEach(script=> onHandler(controller, script));
    }else{
      onHandler(controller, data.script)
    }
  }

  async function onHandler(controller, script){
    controller.on(script.events, async function(bot, message) {
      console.log("onHandler: ", script);
      
      if(script.replies){
        await replyMessage(bot, message, script.replies);
      }

      if(script.dialog){
        await bot.beginDialog(script.dialog);
      }
    });
  }
  //====================================================
  async function initDialog(controller, data){
    if("dialog" != data.type || !data.script || !data.id){
      return;
    }

    let convo = new BotkitConversation(data.id, controller);
    data.script.forEach(s=>addScript(convo, s));
    controller.addDialog(convo);
  }
  
  async function addScript(convo, script){
    addAction(convo, script);
    addAsk(convo, script);    
    addMessage(convo, script);
    addQuestion(convo, script);
    
    addBefore(convo, script.before, script.thread_name);
    addAfter(convo, script);    
  }

  async function addAction(convo, script){
    if("action" != script.type){
      return;
    }

    if(script.thread_name){
      convo.addAction(script.action, script.thread_name);
    }else{
      convo.addAction(script.action);
    }
  }

  async function addAsk(convo, script){
    if("ask" != script.type){
      return;
    }

    if(Array.isArray(script.collect.options)){
      script.collect.options = script.collect.options.map(option=>{
        return toHander(option);
      });
    }else{
      script.collect.options = toHander(script.collect.options);
    }
    
    if(!script.collect || !script.collect.options || script.collect.options.length === 0){
      convo.ask({
        text:script.text,
        quick_replies:script.quick_replies
      }, async()=>{}, script.collect.key);
    }else{
      convo.ask({
        text:script.text,
        quick_replies:script.quick_replies
      }, script.collect.options, script.collect.key)
    }
    console.log("addAsk key====================>:", script.collect.key);
    await onVarChange(convo, script.collect.key);
  }

  //====================================================
  //# send direct Message 
  //====================================================
  async function addMessage(convo, script){
    if("message" != script.type){
      return;
    }
    
    if(script.thread_name){
      convo.addMessage(script.text, script.thread_name);
    }else{
      convo.addMessage(script.text);
    }
  }
  //TODO: editing... 
  async function addQuestion(convo, script){
    if("question" != script.type){
      return;
    }
    if(script.collect && script.collect.options){
      if(Array.isArray(script.collect.options)){
        script.collect.options = script.collect.options.map(option=>{
          return toHander(option);
        });
      }else{
        script.collect.options = toHander(script.collect.options);
      }
    }

    //console.log("addQuestion===================> :", confirm)
    if(!script.collect || !script.collect.options || script.collect.options.length === 0){
      convo.addQuestion({
        text:script.text,
        quick_replies:script.quick_replies
      }, async ()=>{}, script.collect.key, script.thread_name)
    }else{
      convo.addQuestion({
        text:script.text,
        quick_replies:script.quick_replies
      }, script.collect.options, script.collect.key, script.thread_name)
    }
    console.log("addQuestion key==>:", script.collect.key, script.thread_name);
    await onVarChange(convo, script.collect.key);
  }
  
  // TODO: editing...
  async function addBefore(convo, before, thread_name){
    if(!before){
      return;
    }

    console.log("addBefore===================> :", thread_name, before)
    if(Array.isArray(before)){
      before.forEach(before=>{
        addBefore(convo, before, thread_name);
      });
    }else{
      
      //指定Threadへ飛ばす前の処理
      await convo.before(thread_name, async (convoBefore, bot)=>{
        console.log("before======> :", thread_name, before.thread_name, controller.myVariables)
        
        let varValue = "";
        //対応変数がまだない場合、処理しない
        if(controller.myVariables[before.key]){
          varValue = controller.myVariables[before.key];
        }else if(convoBefore.vars[before.key]){
          varValue = convoBefore.vars[before.key];
        }
        console.log("before=============> :", thread_name, before.thread_name, varValue, convoBefore);
        if(!varValue)return;

        var option = convertToRegex(before);
        //入力チェック正常の場合、before.thread_nameへ
        if(option.type==="regex" && option.pattern.test(varValue)){
          console.log("before======> :",thread_name, " goto==> ",before.thread_name);
          convoBefore.gotoThread(before.thread_name);
          return;
        }
        //入力チェック正常の場合、before.thread_nameへ
        if(option.type==="string" && option.pattern === varValue){
          console.log("before======> :",thread_name, " goto==> ",before.thread_name);
          convoBefore.gotoThread(before.thread_name);
          return;
        }
      });
    }
  }

  // TODO: editing...
  async function addAfter(convo, script){
    if(!script.after){
      return;
    }
    console.log("addAfter======confirm> :", script)
    
    let datakey = "datakey";
    // if(script.keywords){
    //   datakey = script.keywords;
    // }else if(script.action){
    //   datakey = script.action;
    // }else if(script.thread_name){
    //   datakey = script.thread_name;
    // }

    convo.after((results)=>{
      controller.myVariables[datakey] = results;
      console.log(`after ==========> key:${datakey}, result:${results}`);
    });
  }

  // TODO: editing... 
  async function onVarChange(convo, key){
    if("string" === typeof(key)){
      convo.onChange(key, async(response)=>{
        controller.myVariables[key] = response;
        console.log(`onVarChange===========[${key}]:[${response}]`);
      });
    }else if(Array.isArray(key)){
      key.forEach(key => {
        convo.onChange(key, async(response)=>{
          controller.myVariables[key] = response;
          console.log(`onVarChange===========[${key}]:[${response}]`);
        });
      });
    }
  }
  //====================================================
  async function initHearHander(controller, data){
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
      //   controller.myVariables.lastMessage = {
      //     type: message.type,
      //     text: message.text,
      //     user: message.user,
      //     channel: message.channel,
      //     value: message.value,
      //     data: {text: message.data.text},
      //     user_profile: message.user_profile,
      //     reply_user: message.reply_user 
      //   };
        
      //   //Object.assign(controller.myVariables.lastMessage.reference, message.reference); 
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
  //# string to event hander
  //====================================================
  function toHander(option){
    if(!option)return option;

    // Regexの場合、Regexに変換
    option = toRegexObject(option);

    if(option.thread_name){
      option.handler = async(response, convo) => {
        console.log("toHander answer==>:", option.thread_name, response);
        await convo.gotoThread(option.thread_name);
      }
    }
    return option;
  }
  //====================================================
  //# string to regex object  
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
  
}
