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
  const API_PREFIX = (process.env.REACT_APP_API_PREFIX ? process.env.REACT_APP_API_PREFIX : "");
  const contentTranslations = {
      en:`

This application is powered by a pair of read-only server-side APIs.
        
The first, an [Apache SOLR](https://solr.apache.org/) search endpoint, is found at [${API_PREFIX}/search](${API_PREFIX}/search?q=*:*)
        
The second, a [SPARQL](https://www.w3.org/TR/sparql11-overview/) endpoint, is found at [${API_PREFIX}/sparql](${API_PREFIX}/sparql?query=%0A%0ASELECT+%3Fs+%3Fp+%3Fo%0AWHERE+%7B%0A++%3Fs+%3Fp+%3Fo%0A%7D%0ALIMIT+5)
`,        
fr:`
Cette application est alimentée par une paire d'API côté serveur en mode lecture seule.

Le premier, un point terminal d'interrogation [Apache SOLR](https://solr.apache.org/), est accessible au [${API_PREFIX}/search](${API_PREFIX}/search?q=*:*)

Le deuxième, un point terminal d'interrogation [SPARQL](http://www.yoyodesign.org/doc/w3c/rdf-sparql-query/), est accessible au [${API_PREFIX}/sparql](${API_PREFIX}/sparql?query=%0A%0ASELECT+%3Fs+%3Fp+%3Fo%0AWHERE+%7B%0A++%3Fs+%3Fp+%3Fo%0A%7D%0ALIMIT+5)
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

