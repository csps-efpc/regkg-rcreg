# Schema

## Warning to consumers:

The regulatory knowledge graph project, being a demonstration project, makes
some opinionated assumptions about the RDF namespaces for regulatory data 
subjects and predicates. 

Wherever possible, the project uses preexisting schema elements from schema.org.

Consumers are advised to consider all schema elements that do not derive from 
schema.org are nonstandard, unofficial, unsupported, etc.

Where a Canadian regulatory body exists, the project derives a "placeholder" 
namespace from that body's web presence URL. It is anticipated that as these 
bodies adopt more mature public namespacing practices, that this project will 
adopt the official namespaces.

## Predicates

### Schema.org predicates
These predicates match the public property definitions.

https://schema.org/legislationChanges
https://schema.org/legislationConsolidates
https://schema.org/legislationDate
https://schema.org/legislationIdentifier
https://schema.org/name
https://schema.org/url
https://schema.org/wordCount

### Custom Predicates
These predicates are ~~made-up~~speculative. The URIs do not correspond to any 
references, so descriptions are included below. 

* https://laws-lois.justice.gc.ca/ext/enables-regulation - the subject entity is an authority that enables the object regulation.
* https://laws-lois.justice.gc.ca/ext/enabling-act - the subject instrument is enabled by the object act of law.
* https://laws-lois.justice.gc.ca/ext/section-count - the subject has the object number of sections. Stored as a literal, with multilingual values.
* https://www.csps-efpc.gc.ca/ext/instrument-references - the subject instrument makes reference to the object instrument.
* https://www.gazette.gc.ca/ext/cba-word-count - the subject regulation's cost-benefit analysis has the given number of words.
* https://www.gazette.gc.ca/ext/consultation-word-count - the subject regulation's consultation analysis has the given number of words.
* https://www.gazette.gc.ca/ext/rias-word-count - the subject regulation's regulatory impact assessment has the given number of words.
* https://www.gazette.gc.ca/ext/sponsor - the subject instrument is sponsored by the minister named in the object. At present, this is a string literal.
* https://www.tpsgc-pwgsc.gc.ca/recgen/ext/department-head - the subject department is headed by the minister named in the object. This is a string literal at present.
* https://www.tpsgc-pwgsc.gc.ca/recgen/ext/org-name - the subject department has the given organizational name. This is a string literal at present.

## Entity namespaces

These are all speculative. Your mileage may vary, etc.

* https://www.canada.ca/en/privy-council/ext/statutory-instrument/ - entities in
this namespace are Canadian statutory instruments. The namespace is suffixed 
with the identifier given to the instrument under the Statutory Instruments 
Regulations ( https://laws-lois.justice.gc.ca/eng/regulations/C.R.C.,_c._1509/FullText.html )
Sections 5 and 6. Where the regulations (or practices) around setting 
identifiers are inconsistent between the English and French versions of the Act 
(ie. Section 5(b)), the specification in the English text is used for the 
purposes of establishing a unique identifier. Where identifiers contain `/` 
characters, a dash `-` is substituted. Where identifiers contain spaces, an 
underscore `_` is substituted. The annual statutes are particularly prone to 
mangling in practice, so they are flattened to the form SC-0000c00. These 
substitutions are made to resolve regulation ID conflicts with the URI schema 
defined in RFC3986. Note that this namespace holds the annual statutes, the 
amending regulations, and their consolidated forms.

* https://orders-in-council.canada.ca/ - entities in this namespace are 
Canadian orders-in-council. The namespace is suffixed with the numeric 
identifier of the order-in-council, unmodified.

* https://www.tpsgc-pwgsc.gc.ca/recgen/orgid/ - entities in this namespace are 
organizations within the canadian federal government. The namespace is suffixed 
with the immutable PWGSC financial ID of the organization.

## RDF Types

* https://canada.ca/ext/act-loi - A Canadian act of law. Subclass of https://schema.org/Legislation
* https://canada.ca/ext/regulation-reglement A Canadian federal regulation. Subclass of https://schema.org/Legislation
* https://canada.ca/ext/orderincouncil-decret A Canadian Order-In-Council as enacted by the Governor-In Council. Subclass of https://schema.org/Legislation
