import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Navigation from "../components/Navigation"


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
