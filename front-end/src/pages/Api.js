import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Theme from "../components/Theme";
import {Context} from "../components/lang/LanguageWrapper";
import MarkdownView from 'react-showdown';

import {FormattedMessage, useIntl } from 'react-intl';

const Api = () => {

  // In the LangWrapper we created a context that exported locale and selectLanguage
  const context = useContext(Context);
  const [apiLang] = useState(context.locale); 

  const contentTranslations = {
      en:`
      
# API English    
      
`,        
fr:`

# API Français
      
`
  };

  const apiContent = () => {    
     return (<MarkdownView
      markdown={contentTranslations[apiLang]}
      options={{ tables: true, emoji: true }}
    />);
  };

  return(
    <Theme>
      {/*Content*/}
      <Container className="p-5 mb-4 bg-light rounded-3">

        {/*Header*/}
        <Row className="">
          <Col>
            <h1 className="header"><FormattedMessage id="app.api.title" /></h1>
          </Col>
        </Row>

        {/*Introduction*/}
        <Row>
          {apiContent()}
        </Row>

      </Container>
    </Theme>
  );
};

export default Api;

