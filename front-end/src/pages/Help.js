import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Theme from "../components/Theme";
import {Context} from "../components/lang/LanguageWrapper";
import MarkdownView from 'react-showdown';

import {FormattedMessage, useIntl } from 'react-intl';

const Help = () => {

  // In the LangWrapper we created a context that exported locale and selectLanguage
  const context = useContext(Context);
  const [helpLang] = useState(context.locale); 

  const contentTranslations = {
      en:`
      
# Terms      
      
A query to the standard query parser is broken up into terms and operators. There are two types of terms: single terms and phrases.

A single term is a single word such as "test" or "hello"

A phrase is a group of words surrounded by double quotes such as "hello dolly"

Multiple terms can be combined together with Boolean operators to form more complex queries (as described below).

# Term Modifiers
Queries support a variety of term modifiers that add flexibility or precision, as needed, to searches. These modifiers include wildcard characters, characters for making a search "fuzzy" or more general, and so on. The sections below describe these modifiers in detail.

# Wildcard Searches
The query parser supports single and multiple character wildcard searches within single terms. Wildcard characters can be applied to single terms, but not to search phrases.

|Wildcard Search Type | Special Character|Example|
|---------------------|------------------|-------|
|Single character (matches a single character)|?|The search string te?t would match both test and text.|
|Multiple characters (matches zero or more sequential characters)|*|The wildcard search: tes* would match test, testing, and tester. You can also use wildcard characters in the middle of a term. For example: te*t would match test and text. *est would match pest and test.|

# Fuzzy Searches
The query parser supports fuzzy searches based on the Damerau-Levenshtein Distance or Edit Distance algorithm. Fuzzy searches discover terms that are similar to a specified term without necessarily being an exact match. To perform a fuzzy search, use the tilde ~ symbol at the end of a single-word term. For example, to search for a term similar in spelling to "roam," use the fuzzy search:

roam~

This search will match terms like roams, foam, & foams. It will also match the word "roam" itself.

An optional distance parameter specifies the maximum number of edits allowed, between 0 and 2, defaulting to 2. For example:

roam~1

This will match terms like roams & foam - but not foams since it has an edit distance of "2".        
        
# Proximity Searches

A proximity search looks for terms that are within a specific distance from one another.

To perform a proximity search, add the tilde character ~ and a numeric value to the end of a search phrase. For example, to search for a "canada" and "service" within 10 words of each other in a document, use the search:

"service canada"~10

The distance referred to here is the number of term movements needed to match the specified phrase. In the example above, if "canada" and "service" were 10 spaces apart in a field, but "canada" appeared before "service", more than 10 term movements would be required to move the terms together and position "canada" to the right of "service" with a space in between.

# Boolean Operators Supported by the Standard Query Parser
Boolean operators allow you to apply Boolean logic to queries, requiring the presence or absence of specific terms or conditions in fields in order to match documents. The table below summarizes the Boolean operators supported by the standard query parser.

|Boolean Operator|Alternative Symbol|Description|
|----------------|------------------|-----------|
|AND|&&|Requires both terms on either side of the Boolean operator to be present for a match.|
|NOT|!|Requires that the following term not be present.|
|OR|\\|\\||Requires that either term (or both terms) be present for a match.|
|+| |Requires that the following term be present.|
|-| |Prohibits the following term (that is, matches on fields or documents that do not include that term). The - operator is functionally similar to the Boolean operator !. Because it’s used by popular search engines such as Google, it may be more familiar to some user communities.|

Boolean operators allow terms to be combined through logic operators. Canada supports AND, “+”, OR, NOT and “-” as Boolean operators.

When specifying Boolean operators with keywords such as AND or NOT, the keywords must appear in all uppercase.

The OR operator is the default conjunction operator. This means that if there is no Boolean operator between two terms, the OR operator is used. The OR operator links two terms and finds a matching document if either of the terms exist in a document. This is equivalent to a union using sets. The symbol || can be used in place of the word OR.

To search for documents that contain either "service canada" or just "service," use the query:

"service canada" service

or

"service canada" OR service

# The Boolean Operator +
The + symbol (also known as the "required" operator) requires that the term after the + symbol exist somewhere in a field in at least one document in order for the query to return a match.

For example, to search for documents that must contain "service" and that may or may not contain "health," use the following query:

+service health
        
# The Boolean Operator NOT (!)

The NOT operator excludes documents that contain the term after NOT. This is equivalent to a difference using sets. The symbol ! can be used in place of the word NOT.

The following queries search for documents that contain the phrase "service canada" but do not contain the phrase "Service Canada":

"service canada" NOT "Service Canada"

"service canada" ! "Service Canada"

# The Boolean Operator -
The - symbol or "prohibit" operator excludes documents that contain the term after the - symbol.

For example, to search for documents that contain "service canada" but not "Service Canada," use the following query:

"service canada" -"Service Canada"

# Grouping Terms to Form Sub-Queries
Queries support using parentheses to group clauses to form sub-queries. This can be very useful if you want to control the Boolean logic for a query.

The query below searches for either "service" or "canada" and "website":

(service OR canada) AND website

This adds precision to the query, requiring that the term "website" exist, along with either term "service" and "canada."
`,        
fr:`
# Termes
      
Une requête adressée à l'analyseur de requêtes standard est divisée en termes et opérateurs. Il existe deux types de termes : les termes simples et les expressions.

Un seul terme est un seul mot tel que "test" ou "hello"

Une phrase est un groupe de mots entourés de guillemets tels que "hello dolly"

Plusieurs termes peuvent être combinés avec des opérateurs booléens pour former des requêtes plus complexes (comme décrit ci-dessous).

# Modificateurs de terme
Les requêtes offrent une variété de modificateurs de terme qui ajoutent de la flexibilité ou de la précision, selon les besoins, aux recherches. Ces modificateurs incluent des caractères génériques, des caractères permettant de rendre une recherche "floue" ou plus générale, etc. Les sections ci-dessous décrivent ces modificateurs en détail.

# Recherches génériques
L'analyseur de requête offre les recherches de caractères génériques uniques et multiples dans des termes uniques. Les caractères génériques peuvent être appliqués à des termes uniques, mais pas aux expressions de recherche.

|Type de recherche générique | Caractère spécial|Exemple|
|----------------------------|------------------|-------|
|Caractère unique (correspond à un seul caractère)|?|La chaîne de recherche te?t correspondrait à la fois au test et au texte.|
|Plusieurs caractères (correspond à zéro ou plusieurs caractères séquentiels)|*|La recherche générique : tes* correspondrait à test, testing et tester. Vous pouvez également utiliser des caractères génériques au milieu d'un terme. Par exemple : te*t correspondrait à test et text. *est correspondrait à ravageur et test.|

# Recherches floues
L'analyseur de requêtes prend en charge les recherches floues basées sur l'algorithme Damerau-Levenshtein Distance ou Edit Distance. Les recherches floues découvrent des termes similaires à un terme spécifié sans nécessairement être une correspondance exacte. Pour effectuer une recherche floue, utilisez le symbole tilde ~ à la fin d'un terme composé d'un seul mot. Par exemple, pour rechercher un terme dont l'orthographe est similaire à "errer", utilisez la recherche approximative :

errer~

Cette recherche correspondra à des termes tels que roams, foam et foams. Il correspondra également au mot "errer" lui-même.

Un paramètre de distance facultatif spécifie le nombre maximal de modifications autorisées, entre 0 et 2, la valeur par défaut étant 2. Par exemple :

itinérance~ 1

Cela correspondra à des termes tels que roams & foam - mais pas à foams car il a une distance d'édition de "2".        

# Recherches de proximité

Une recherche de proximité recherche des termes qui se trouvent à une distance spécifique les uns des autres.

Pour effectuer une recherche de proximité, ajoutez le caractère tilde ~ et une valeur numérique à la fin d'une expression de recherche. Par exemple, pour rechercher un « canada » et un « service » à moins de 10 mots l'un de l'autre dans un document, utilisez la recherche :

"service canada"~10

La distance à laquelle il est fait référence ici est le nombre de mouvements de termes nécessaires pour correspondre à la phrase spécifiée. Dans l'exemple ci-dessus, si « canada » et « service » étaient séparés de 10 espaces dans un champ, mais que « canada » apparaissait avant « service », il faudrait plus de 10 déplacements de termes pour rapprocher les termes et positionner « canada » sur le droit de "service" avec un espace entre les deux.

# Opérateurs booléens offerts par l'analyseur de requêtes standard
Les opérateurs booléens vous permettent d'appliquer une logique booléenne aux requêtes, nécessitant la présence ou l'absence de termes ou de conditions spécifiques dans les champs afin de faire correspondre les documents. Le tableau ci-dessous résume les opérateurs booléens pris en charge par l'analyseur de requêtes standard.

|Opérateur booléen|Symbole alternatif|Description|
|-----------------|------------------|-----------|
|AND|&&|Nécessite que les deux termes de chaque côté de l'opérateur booléen soient présents pour une correspondance.|
|NOT|!|Nécessite que le terme suivant ne soit pas présent.|
|OR|\\|\\||Nécessite que l'un des termes (ou les deux) soit présent pour une correspondance.|
|+| |Nécessite que le terme suivant soit présent.|
|-| |Interdit le terme suivant (c'est-à-dire les correspondances sur des champs ou des documents qui n'incluent pas ce terme). L'opérateur - est fonctionnellement similaire à l'opérateur booléen !. Parce qu'il est utilisé par des moteurs de recherche populaires tels que Google, il peut être plus familier à certaines communautés d'utilisateurs.|

Les opérateurs booléens permettent de combiner des termes via des opérateurs logiques. La recherche prend en charge AND, « + », OR, NOT et « - » comme opérateurs booléens.

Lorsque vous spécifiez des opérateurs booléens avec des mots-clés tels que AND ou NOT, les mots-clés doivent apparaître en majuscules.

L'opérateur OU est l'opérateur de conjonction par défaut. Cela signifie que s'il n'y a pas d'opérateur booléen entre deux termes, l'opérateur OU est utilisé. L'opérateur OU relie deux termes et trouve un document correspondant si l'un des termes existe dans un document. Cela équivaut à une union utilisant des ensembles. Le symbole || peut être utilisé à la place du mot OU.

Pour rechercher des documents qui contiennent soit « service canada », soit simplement « service », utilisez la requête :

service "service canada"

ou

"service canada" OR service

# L'opérateur booléen +
Le symbole + (également connu sous le nom d'opérateur "obligatoire") nécessite que le terme après le symbole + existe quelque part dans un champ d'au moins un document pour que la requête renvoie une correspondance.

Par exemple, pour rechercher des documents qui doivent contenir « service » et qui peuvent ou non contenir « santé », utilisez la requête suivante :

+service santé
        
# L'opérateur booléen NOT (!)

L'opérateur NOT exclut les documents qui contiennent le terme après NOT. Cela équivaut à une différence utilisant des ensembles. Le symbole ! peut être utilisé à la place du mot NOT.

Les requêtes suivantes recherchent des documents qui contiennent l'expression « service canada » mais ne contiennent pas l'expression « Service Canada » :

"service canada" NOT "Service Canada"

"service canada" ! "Service Canada"

# L'opérateur booléen -
Le symbole - ou l'opérateur "interdire" exclut les documents qui contiennent le terme après le symbole -.

Par exemple, pour rechercher des documents qui contiennent "service canada" mais pas "canada service", utilisez la requête suivante :

"service canada" -"canada service"

# Regroupement de termes pour former des sous-requêtes
Les requêtes prennent en charge l'utilisation de parenthèses pour regrouper des clauses afin de former des sous-requêtes. Cela peut être très utile si vous souhaitez contrôler la logique booléenne d'une requête.

La requête ci-dessous recherche soit « service », soit « canada » et « santé » :

(service OR canada) AND santé

Cela ajoute de la précision à la requête, exigeant que le terme "santé" existe, ainsi que les termes "service" et "canada".
`
  };

  const helpContent = () => {    
     return (<MarkdownView
      markdown={contentTranslations[helpLang]}
      options={{ tables: true, emoji: true }}
    />);
  };

  return(
    <Theme>
      {/*Content*/}
      <Container className="p-5 mb-4 bg-light rounded-3">

        {/*Header*/}
        <Row className="">
          <Col>
            <h1 className="header"><FormattedMessage id="app.help.title" /></h1>
          </Col>
        </Row>

        {/*Introduction*/}
        <Row>
          {helpContent()}
        </Row>

      </Container>
    </Theme>
  );
};

export default Help;

