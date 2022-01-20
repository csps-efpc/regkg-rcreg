import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import {IntlProvider} from 'react-intl';
import LanguageWrapper from "./components/lang/LanguageWrapper";
import "./index.css"
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
	<LanguageWrapper>
		<App />
	</LanguageWrapper>,
	document.getElementById("root")
);
