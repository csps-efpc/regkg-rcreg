import React, { useState } from "react";
import {FormattedMessage} from 'react-intl';
import Pagination from 'react-bootstrap/Pagination'
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


const PaginationQuery = (props) => {
  const calculatedMaxOffset = () =>{
    // convert from maximum number of items found to highest index to set it to
    return (Math.floor(props.maxOffset / 10) * 10);
  }

  const calculatedPageOffset = () =>{
    // Convert from 0 based array offset to human readable page number
    return (Math.floor(props.pageOffset / 10) + 1);
  }

  return(
    <Pagination>
      {props.pageOffset > 9 ?
        <>
          <Pagination.First onClick={()=>{props.setPageOffset(0)}}/>
          <Pagination.Prev onClick={()=>{props.setPageOffset(prevState => prevState - 10)}}/>
          <Pagination.Item onClick={()=>{props.setPageOffset(prevState => prevState - 10)}}>{calculatedPageOffset() - 1}</Pagination.Item>
          <Pagination.Item active>{calculatedPageOffset()}</Pagination.Item>
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