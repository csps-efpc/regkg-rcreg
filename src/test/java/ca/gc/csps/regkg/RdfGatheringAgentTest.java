package ca.gc.csps.regkg;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.jdom2.JDOMException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for parts of the RdfGathering agent. Unit coverage supports the
 * IntegrationTest coverage that exercises most everything.
 *
 * @author jturner
 */
public class RdfGatheringAgentTest {
    
    public RdfGatheringAgentTest() {
    }

    /**
     * Test of normalizeOICNumber method, of class RdfGatheringAgent.
     */
    @Test
    public void testNormalizeOICNumber() {
        System.out.println("normalizeOICNumber");
        RdfGatheringAgent instance = new RdfGatheringAgent();
        assertEquals("1234-5678", instance.normalizeOICNumber("1234-5678"));
        assertEquals("1234-0567", instance.normalizeOICNumber("1234-567"));
        // Em-dashes in data.
        assertEquals("1987-0584", instance.normalizeOICNumber("1987–584"));
    }
    
}
