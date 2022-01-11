import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Navigation from "../components/Navigation"

/*
  Pages of Use: All
  Description: Provides an easy way for all of the pages to have a similar look and feel.
  Implements the navigation bar so that each page does not need to.
*/

const Theme = (props) => {
  return(
    <>
      <Navigation />
      <Container className="p-3">
        {props.children}
      </Container>
    </>
  );
}

export default Theme;
