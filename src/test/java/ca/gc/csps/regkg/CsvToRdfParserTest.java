package ca.gc.csps.regkg;

import java.io.File;
import java.net.URISyntaxException;
import java.nio.file.Paths;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
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
    return Paths.get(getClass().getResource("test1.csv").toURI()).toFile();
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
///assertTrue(model.listStatements(rsrc, prprt, string));
    }

    
}
