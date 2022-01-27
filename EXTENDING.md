# Extending the model locally

## Option 1 - The easy way.

If your data is already in RDF, you can add your files in .ttl (Turtle) or .nt 
(N-Triple) format to the /rdf folder before running the Maven build and the rest
will be taken care of automatically.

## Option 2 - The best way.

If you have access to a live source of data that you want to integrate, you can 
add the code to fetch and integrate your data to the model to the project. We 
*love* community contributions, but please be certain to conform to the code of 
conduct when doing so. Remember that other users may not have access to your 
datasources; your implementations should fail gracefully if the sources are 
unavailable. 

## Option 3 - The middle path.

If you're just looking to experiment with making your data fit, the /rdf folder 
also supports data dumps in CSV format. There are a few conditions you have to 
conform to for it to work:
* Your CSV must either be UTF-8 encoded, or only use low-ASCII characters.
* You must use commas as field delimiters, and carriage returns as record 
delimiters.
* You can enclose fields in quotes `"` if you like.
* Leading and trailing spaces will be trimmed from unquoted field values.
* You must have a header row:
    * The first header is the prefix namespace for your entities. It will be 
prepended to the values in the first column to create the URIs of your RDF 
subjects.
    * The second and subsequent headers are the fully-qualified names of the 
predicates that you'll be providing to the model.
    * The second and subsequent columns are the objects you'll be adding to the 
model. Parsing uses a fallback scheme:
        * If the value can be parsed as a URI, it's treated as an RDF Resource 
URI, unless the predicate is the schema.org URL predicate, when it will be 
parsed as a URL.
        * If the value can be parsed as a number, it will be treated as an XSD 
Double literal.
        * The value is otherwise parsed as a String literal.

There's a working example in the test resources.