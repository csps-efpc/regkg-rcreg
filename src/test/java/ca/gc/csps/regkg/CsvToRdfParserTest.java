package ca.gc.csps.regkg;

import java.io.File;
import java.net.URISyntaxException;
import java.nio.file.Paths;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;
import org.apache.jena.rdf.model.impl.PropertyImpl;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 *
 * @author jturner
 */
public class CsvToRdfParserTest {

    public CsvToRdfParserTest() {
    }

    //Utility method to get resource files. Only works at test-time.
    private File getResourceFile(String spec) throws URISyntaxException {
        return Paths.get(getClass().getResource(spec).toURI()).toFile();
    }

    /**
     * Test of parse method, of class CsvToRdfParser.
     */
    @Test
    public void testParse() throws Exception {
        System.out.println("parse");
        File inputFile = getResourceFile("test1.csv");
        Model model = ModelFactory.createDefaultModel();
        CsvToRdfParser instance = new CsvToRdfParser();
        instance.parse(inputFile, model);
        model.write(System.out, "TTL");
        Resource eenie = ResourceFactory.createResource("test1:eenie");
        Resource meenie = ResourceFactory.createResource("test1:meenie");
        Resource mynie = ResourceFactory.createResource("test1:mynie");
        Resource moe = ResourceFactory.createResource("test1:moe");
        Assertions.assertTrue(model.contains(
                eenie,
                new PropertyImpl("https://schema.org/name"),
                "The OG") , "Insertion of simple string properties");
        Assertions.assertTrue(model.contains(
                meenie,
                new PropertyImpl("https://schema.org/url"),
                "https://www.youtube.com/watch?v=oavMtUWDBTM"), "Insertion of schema.org URL property"); 
        Assertions.assertTrue(model.contains(
                mynie,
                new PropertyImpl("custom:rank"),
                model.createTypedLiteral(3.0D)), "Insertion of numeric properties as double literals");
        Assertions.assertTrue(model.contains(
                moe,
                new PropertyImpl("test1:ext/loop"),
                eenie), "Insertion of entity-to-entity properties");
    }

}
