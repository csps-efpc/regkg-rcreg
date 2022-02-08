import React, { useState, useContext, useEffect }
from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Nav from "react-bootstrap/Nav";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import {FormattedMessage} from 'react-intl';
import "../style.css";
import logo from "../img/logo.svg";
import * as d3 from "d3";
import Theme from "../components/Theme";
import QueryBox from "../components/search/QueryBox";
import ForceGraph from "../components/ForceGraph";
import SingleResult from "../components/search/result/SingleResult";
import PaginationQuery from "../components/search/PaginationQuery";
import { useParams  } from 'react-router-dom';
import {Context} from "../components/lang/LanguageWrapper";

export default function Mesh() {
  // create nodes with unique ids
  // radius: 5px
  const nodes = [
      {id: "5", r: 5, name:"foo" },
      {id: "6", r: 5, name:"bar" },
      {id: "7", r: 5, name:"baz" },
      {id: "8", r: 5, name:"winken" },
      {id: "9", r: 5, name:"blinken" },
      {id: "10", r: 5, name:"nod" },
    ];
  
  const edges = [
      {
          source: "5", target: "6", name: "linkety link"
      }
      //,{
//          source: 6, target: 7
//      },{
//          source: 5, target: 8
//      },
      
  ]
  
  const props = {
      nodes: nodes,
      links: edges
  }

  return (
    <div>
      <h1>React & D3 force graph</h1>
        <ForceGraph props={props} radius={10} width={800} height={800}/>      
    </div>
  );
}