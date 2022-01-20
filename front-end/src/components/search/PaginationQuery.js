import React, { useState } from "react";
import { FormattedMessage, useIntl } from 'react-intl';
import Pagination from 'react-bootstrap/Pagination'
import "../../style.css";

/*
  Pages of Use: Search
  Description: Pagination of search results

  Props:
    props.maxOffset: The number of total results the query returns, ex 123
    props.pageOffset: current search offset, base 0, ex 0 = page 1, 10 = page 2, 20 = page 3
    props.setPageOffset: function to update the pageOffset, set it to any number
*/


const PaginationQuery = (props) => {
  const ariaTranslations = {
    resultsControlsAria : useIntl().formatMessage({id: "app.search.resultsControlsAria"}),
  }
  const calculatedMaxOffset = () =>{
    // convert from maximum number of items found to highest index to set it to
    return (Math.floor(props.maxOffset / 10) * 10);
  }

  const calculatedPageOffset = () =>{
    // Convert from 0 based array offset to human readable page number
    return (Math.floor(props.pageOffset / 10) + 1);
  }

  return(
    <Pagination tabIndex="0" aria-label={ariaTranslations.resultsControlsAria}>
      {props.pageOffset > 9 ?
        <>
          <Pagination.First onClick={()=>{props.setPageOffset(0)}}/>
          <Pagination.Prev onClick={()=>{props.setPageOffset(prevState => prevState - 10)}}/>
          <Pagination.Item onClick={()=>{props.setPageOffset(prevState => prevState - 10)}}>{calculatedPageOffset() - 1}</Pagination.Item>
          <Pagination.Item tabIndex="0" active>{calculatedPageOffset()}</Pagination.Item>
        </>
        :
        <>
          <Pagination.First disabled/>
          <Pagination.Prev disabled/>
          <Pagination.Item active>{calculatedPageOffset()}</Pagination.Item>
        </>
      }
      {props.pageOffset >= calculatedMaxOffset() ?
        <>
          <Pagination.Next disabled/>
          <Pagination.Last disabled/>
        </>
        :
        <>
          <Pagination.Item onClick={()=>{props.setPageOffset(prevState => prevState + 10)}}>{calculatedPageOffset() + 1}</Pagination.Item>
          <Pagination.Next onClick={()=>{props.setPageOffset(prevState => prevState + 10)}}/>
          <Pagination.Last onClick={()=>{props.setPageOffset(calculatedMaxOffset())}}/>
        </>
      }
    </Pagination>
  );
}

export default PaginationQuery;