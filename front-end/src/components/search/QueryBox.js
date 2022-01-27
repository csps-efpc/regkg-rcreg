import React, { useState, useEffect, useRef } from "react";
import { FormattedMessage, useIntl } from 'react-intl';
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import Alert from "react-bootstrap/Alert";
import "../../style.css";

/*
  Pages of Use: Search
  Description: Search box for new queries.
  Uses and updates the parents SearchQuery state

  Props:
    searchQuery: state from Search which holds the value in the search box
    setSearchQuery: function to update the searchQuery state

    searchResults: state from Search which holds the return value from searching
    setsearchResults: function to update the searchResults state

    language: language code the UI is currently set to, ex: en, fr

*/

const QueryBox = (props) => {

  const ariaTranslations = {
    searchBox : useIntl().formatMessage({id: "app.search.searchBoxAria"}),
    submitButton : useIntl().formatMessage({id: "app.search.submitButtonAria"}),
  }

  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState("app.query.errorGeneric");

  // String containing what the user has put in the search box
  const [userSearchValue, setUserSearchValue] = useState("");

  // String containing what to send to the API (updated on key or button press)
  const [searchQuery, setSearchQuery] = useState("");


  // Clear the Search Query and Search Results when the language context is updated.
  useEffect(() => {
    setUserSearchValue("");
  }, [props.language]);

  const submitQuery = async() => {
    /* Single search term: https://example.com/search?df=text_en_txt&q=fish */
    const API_PREFIX = (process.env.REACT_APP_API_PREFIX ? process.env.REACT_APP_API_PREFIX : "");
    const solrPath = "/search?"
    const langTerms = `text_${props.language}_txt`;
    const searchTerms = `q=${searchQuery}`;
    const requestURL = API_PREFIX + solrPath;

    setShow(false);

    fetch(requestURL + new URLSearchParams({
        q:searchQuery,
        df:`text_${props.language}_txt`,
        fl:"*,score",
        start:props.pageOffset,
        'q.op': "AND"
    }), {
      method: "GET",
      dataType: "JSON",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      }
    })
    .then((resp) => {   //fetch does not return non network errors, check for problems first!
      if(!resp.ok){
        throw Error(resp.statusText);
      }
      return resp;
    })
    .then((resp) => {
      return resp.json()
    }) 
    .then((data) => {
      if(data.response.numFound <= 0){
        throw Error("app.query.errorNoResults");
      }
      props.setsearchResults(data.response);
    })
    .catch((error) => {
      if(error.message == "app.query.errorNoResults"){
        // No results have been found
        setErrorMessage(error.message);
      }
      else if(error.name == "TypeError" && error.message == "Failed to fetch"){
        // Network error (API down, incorrect URL, Accept-Origin, etc.)
        setErrorMessage("app.query.errorFailedToFetch");
      } else {
        // Other error happened, log the results and return generic message
        console.log(error, "Unseen Error Found");
        setErrorMessage("app.query.errorGeneric");
      }
      props.setsearchResults("");
      setShow(true);
    })
  }

  const updateQuery = (e) => {
    setUserSearchValue(e.target.value);
  }

  // Used to skip the first render
  const skipOffsetQuery = useRef(true);
  // Submit a new query whenever pageOffset updated by pagination
  useEffect(() => {
    if (skipOffsetQuery.current) {
       skipOffsetQuery.current = false;
    } else {
        submitQuery();
    }
  }, [props.pageOffset]);

  // For keyboard navigation
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      processQueryForSubmit();
    }
  }

  //
  const processQueryForSubmit = () => {
    props.setPageOffset(0);
    setSearchQuery(userSearchValue);
    // Updateing SearchQuery will trigger useEffect(() => {submitQuery()}, [searchQuery])
  }

  // Used to skip the first render
  const isInitialMountQuery = useRef(true);
  useEffect(() => {isInitialMountQuery.current ? isInitialMountQuery.current = false : submitQuery()}, [searchQuery])

  return(
    <>
      <InputGroup size="lg">
        <FormControl aria-label={ariaTranslations.searchBox} aria-describedby="inputGroup-sizing-lg" onChange={updateQuery} value={userSearchValue} onKeyPress={handleKeyPress}/>
        <Button aria-label={ariaTranslations.submitButton} variant="primary" id="search-button" onClick={processQueryForSubmit}>
          <FormattedMessage id = "app.search.mainButton" />
        </Button>
      </InputGroup>
      {show ? 
      <Alert variant="danger" onClose={() => setShow(false)} dismissible className="mt-2">
        <Alert.Heading><FormattedMessage id = "app.query.errorHeader" /></Alert.Heading>
        <p tabIndex="0">
          <FormattedMessage id = {errorMessage} />
        </p>
      </Alert> : ""
      }
    </>
  );
}

export default QueryBox;