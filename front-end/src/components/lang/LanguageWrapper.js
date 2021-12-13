import React, {useState} from "react";
import {IntlProvider} from "react-intl";

export const Context = React.createContext();

// Determines the language based on the browser settings
// If browser path, or cookies are a requirement then this is the place to set it.
const localeBrowser = navigator.language.split(/[-_]/)[0];  // language without region code


/*
    Function: importTranslations
    Purpose: Import all of the data files in the parameter folder

    For each file in the supploed folder, import them and map them using the file name
    Return this object containing all of their contents
*/
const importTranslations = (r) => {
  let translations = {};
  r.keys().map((item, index) => { translations[item.replace('./', '')] = r(item); });
  return translations;
}

// Import all of the json files in the current directory
const translations = importTranslations(require.context('./', false, /\.(json)$/));

// define langMessages with a default value of english
let langMessages = translations["en.json"];

// if the broser language exists in the translations folder, set it to langMessages
if(localeBrowser + ".json" in translations){
    // Translation Found
    langMessages = translations[localeBrowser + ".json"];
}else{
    // Translation Not Found, no op
    ;
}

const LanguageWrapper = (props) => {
    const [locale, setLocale] = useState(localeBrowser);
    const [messages, setMessages] = useState(langMessages);
    
    function selectLanguage(langParam) {
       setLocale(langParam);
       setMessages(translations[langParam + ".json"]);
    }

    function getLocale(){
        return locale;
    }
    
    return (
        <Context.Provider value = {{locale, selectLanguage}}>
            <IntlProvider messages={messages} locale={locale}>
                {props.children}
            </IntlProvider>
        </Context.Provider>
    );
}



export default LanguageWrapper;
