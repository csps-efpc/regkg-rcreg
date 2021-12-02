import React, {useState} from "react";
import {IntlProvider} from "react-intl";
import French from "./fr.json";
import English from "./en.json";

export const Context = React.createContext();

const localeBrowser = navigator.language.split(/[-_]/)[0];  // language without region code

let langMessages = English; // Is this accurately setting based on browser information(?)
let langCode = "en"
if (localeBrowser ==="en") {
    langMessages = English;
    langCode = "en";
} else {
    langMessages = French;
    langCode = "fr";
}

const LanguageWrapper = (props) => {
    const [locale, setLocale] = useState(langCode);
    const [messages, setMessages] = useState(langMessages);
    
    function selectLanguage(langParam) {
       setLocale(langParam);
       if (langParam === "en") {
           setMessages(English);
       } else {
           setMessages(French);
       }
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
