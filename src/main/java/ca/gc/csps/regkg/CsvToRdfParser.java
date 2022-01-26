package ca.gc.csps.regkg;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map.Entry;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ResourceFactory;
import org.apache.jena.rdf.model.impl.PropertyImpl;

/**
 * Class responsible for parsing a CSV input file into RDF triples
 *
 * @author jturner
 */
public class CsvToRdfParser {

    public void parse(File inputFile, Model model) throws IOException {
        parse(inputFile, StandardCharsets.UTF_8, model);
    }

    private String expandURI(String spec, Model model) {
        for (Entry<String, String> entry : model.getNsPrefixMap().entrySet()) {
            if (spec.startsWith(entry.getKey())) {
                return entry.getValue() + spec.substring(entry.getKey().length());
            }
        }
        return spec;
    }

    private boolean isValidAbsoluteURI(String spec) {
        try {
            return new URI(spec).isAbsolute();
        } catch (URISyntaxException ex) {
            return false;
        }
    }

    public void parse(File inputFile, Charset charset, Model model) throws IOException {
        FileReader in = new FileReader(inputFile.getAbsoluteFile(), charset);
        CSVParser records = CSVFormat.DEFAULT.withNullString("").withIgnoreSurroundingSpaces().withHeader().parse(in);
        List<String> headerNames = records.getHeaderNames();
        String subjectPrefix = headerNames.get(0);
        for (String predicateSpec : headerNames) {
            if (!predicateSpec.equals(subjectPrefix)) {
                String expandedSpec = expandURI(predicateSpec, model);
                try {
                    URI uri = new URI(expandedSpec);
                    if (!uri.isAbsolute()) {
                        throw new IOException(inputFile.getName() + " " + predicateSpec + " [ " + expandedSpec + " ] Does not define an absolute URI predicate.");
                    }
                } catch (URISyntaxException ex) {
                    throw new IOException(inputFile.getName() + " " + predicateSpec + " [ " + expandedSpec + " ] Cannot be parsed as a valid URI predicate.", ex);
                }
            }
        }
        for (CSVRecord record : records) {
            long recordNumber = record.getRecordNumber();
            String subjectURI = subjectPrefix + record.get(subjectPrefix);
            String expandedSubjectURI = expandURI(subjectURI, model);
            if (!isValidAbsoluteURI(expandedSubjectURI)) {
                throw new IOException(inputFile.getName() + ":" + recordNumber + " " + subjectURI + " [ " + expandedSubjectURI + " ] Does not define a valid absolute URI predicate.");
            }
            for (String predicateString : headerNames) {
                if (!predicateString.equals(subjectPrefix)) {
                    String expandedPredicateString = expandURI(predicateString, model);
                    String objectString = record.get(predicateString);
                    String expandedObjectString = expandURI(objectString, model);
                    // Now for some fancy dancing to figure out what the object is intended to be.
                    if (isValidAbsoluteURI(expandedObjectString)) {
                        //It's a URI. We treat it as an RDF entity unless the 
                        //predicate is specifically the URL one from schema.org
                        if (expandedPredicateString.equals("https://schema.org/url")) {
                            model.add(ResourceFactory.createResource(expandedSubjectURI), new PropertyImpl(expandedPredicateString), expandedObjectString);
                        } else {
                            model.add(ResourceFactory.createResource(expandedSubjectURI), new PropertyImpl(expandedPredicateString), ResourceFactory.createResource(expandedObjectString));
                        }
                    } else if (NumberUtils.isCreatable(expandedObjectString)) {
                        model.add(ResourceFactory.createResource(expandedSubjectURI), new PropertyImpl(expandedPredicateString), model.createTypedLiteral(Double.valueOf(expandedObjectString)));
                    } else {
                        model.add(ResourceFactory.createResource(expandedSubjectURI), new PropertyImpl(expandedPredicateString), expandedObjectString);
                    }
                }
            }
        }
    }
}
