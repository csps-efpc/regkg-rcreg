import React, { useState, useContext, useEffect }
from "react";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Nav from "react-bootstrap/Nav";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import {useIntl} from 'react-intl';
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
import {TraversablePredicates} from "../components/TraversablePredicates";

export default function Mesh() {

    const {searchParameterUrl} = useParams();
    const langContext = useContext(Context);
    const currentLang = langContext.locale;
    const [meshResults, setMeshResults] = useState({nodes: [], links: []});
    const sparqlPath = "/sparql?";
    const API_PREFIX = (process.env.REACT_APP_API_PREFIX ? process.env.REACT_APP_API_PREFIX : "");
    const solrPath = "/search?"
    const intl = useIntl()
    
    const submitQuery = async() => {
        const langTerms = `text_${currentLang}_txt`;
        const searchTerms = `q=${searchParameterUrl}`;
        const requestURL = API_PREFIX + solrPath;

        fetch(requestURL + new URLSearchParams({
            q: searchParameterUrl,
            df: `text_${currentLang}_txt`,
            fl: "id",
            'q.op': "AND",
            rows: 100
        }), {
            method: "GET",
            dataType: "JSON",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
            }
        })
                .then((resp) => {   //fetch does not return non network errors, check for problems first!
                    if (!resp.ok) {
                        throw Error(resp.statusText);
                    }
                    return resp;
                })
                .then((resp) => {
                    return resp.json()
                })
                .then((data) => {
                    if (data.response.numFound <= 0) {
                        throw Error("app.query.errorNoResults");
                    }
                    var set = new Set();
                    data.response.docs.forEach((i) => {
                        if(!i.id.indexOf("#") > 0) {
                            set.add(i.id);
                        } else {
                            set.add(i.id.substring(0, i.id.indexOf("#")));
                        }
                    });
                    return Array.from(set);
                }).then((data) => {
            const traversablePredicateList = TraversablePredicates.map((p) => {
                return "<" + p + ">"
            }).join(", ");
            const subjectList = data.map((p) => {
                return "<" + p + ">"
            }).join(", ");
            const queryTerms = "query=" + encodeURIComponent("SELECT ?s ?p ?o ?n {?s ?p ?o OPTIONAL { ?o <https://schema.org/name> ?n FILTER (LANG(?n) IN (\"" + currentLang + "\" , \"\"))} FILTER ( (?p IN (<https://schema.org/name>, " + traversablePredicateList + ") && ((LANG(?o) IN (\"" + currentLang + "\" , \"\")) || isURI(?o))) && ?s IN (" + subjectList + "))} LIMIT 100 ")
            const acceptTerms = "&Accept=application/sparql-results%2Bjson";
            const requestPayload = queryTerms + "&Accept=application/sparql-results%2Bjson";
            return requestPayload;
        }).then((payload) => {
            fetch(API_PREFIX + sparqlPath, {
                method: 'POST',
                mode: 'cors',
                cache: 'default',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: payload // body data type must match "Content-Type" header
            })
                    .then((resp) => {
                        return resp.json();
                    })
                    .then((data) => {
                        console.log(data);
                        setMeshResults(buildMeshResults(data.results.bindings));
                    })
        })

                .catch((error) => {
                    if (error.message == "app.query.errorNoResults") {
                        // No results have been found
                        console.log(error.message);
                    } else if (error.name == "TypeError" && error.message == "Failed to fetch") {
                        // Network error (API down, incorrect URL, Accept-Origin, etc.)
                        console.log("app.query.errorFailedToFetch");
                    } else {
                        // Other error happened, log the results and return generic message
                        console.log(error, "Unseen Error Found");
                        console.log("app.query.errorGeneric");
                    }
                });
    }

    useEffect(() => {
        submitQuery();

    }, [searchParameterUrl]);

    const buildMeshResults = (bindings) => {
        var nodeMap = new Map();
        var edges = [];
        var nodes = [];
        bindings.forEach((binding) => {
           if(!nodeMap.has(binding.s.value)) {
               nodeMap.set(binding.s.value, binding.s.value.substring(binding.s.value.lastIndexOf("/")));
           }
           if(!nodeMap.has(binding.o.value) && binding.o.type === "uri") {
               nodeMap.set(binding.o.value, binding.o.value.substring(binding.o.value.lastIndexOf("/")));
           }
            if (binding.p.value === 'https://schema.org/name') {
                nodeMap.set(binding.s.value, binding.o.value);
            } else {
                edges.push({
                    source: binding.s.value,
                    target: binding.o.value,
                    name: (intl.messages[binding.p.value] ? intl.messages[binding.p.value] : binding.p.value.substring(binding.p.value.lastIndexOf("/")))
                });
                if (binding.hasOwnProperty("n")) {
                    nodeMap.set(binding.o.value, binding.n.value);
                }
            }
        });
        nodeMap.forEach((key, value) => {
            nodes.push({
                id: value,
                name: key
            });
        });
        return {nodes: nodes, links: edges};
    }
    var key = Math.random();
            return (
                    <Theme>
    {/*Content*/}
    <Container className="p-5 mb-4 bg-light rounded-3">

        
            {/*Header*/}
            
        <Row className="">
            <Col> 

            <div>
                <h1>{searchParameterUrl}</h1>
                <ForceGraph key={key} props={meshResults} radius={10} width={1200} height={1200}/>      
            </div>
            </Col>
        </Row>
    </Container>
</Theme>
            );
    }