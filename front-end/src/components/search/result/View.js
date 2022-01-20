import React from "react";
import { FormattedMessage, useIntl } from 'react-intl';
import Button from "react-bootstrap/Button";
/*
  Pages of Use: Search
  Description: Button to open the result in a new tab.

  props:
    id: a string identifying the exact regulatory instrument's URI (not url!)
      example: https://www.canada.ca/en/privy-council/ext/statutory-instrument/P-15.6
    language: the language code for the current UI language.
    linktarget: a string identifying the closest web-browser target URL for the given result.

*/

const View = (props) => {
    
  const ariaTranslations = {
    link : useIntl().formatMessage({id: "app.result.link"}),
  }
    
    if (props.linktarget) {
        return(
        <Button aria-label={ariaTranslations.link} variant="light" className="left-button" size="lg" onClick={()=> window.open(props.linktarget, "_blank")}>
          <span className="material-icons inline-icon-large">open_in_new</span><FormattedMessage id = "app.result.link" />
        </Button>
        );
    } else {
        return "";
    }
}

export default View;