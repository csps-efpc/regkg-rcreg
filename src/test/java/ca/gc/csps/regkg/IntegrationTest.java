package ca.gc.csps.regkg;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mapdb.DB;
import org.mapdb.Serializer;

/**
 *
 * @author jturner
 */
public class IntegrationTest {

    private static final String TDB_BUILD_PATH = "./target/build.tdb";
    private static final String TTL_BUILD_PATH = "./target/out.ttl";
    private static final String SQLITE_BUILD_PATH = "./target/out.sqlite3";
    private static final String INDEX_BUILD_PATH = "./target/out.json";
    private static final String MAPDB_BUILD_PATH = "./target/build.mdb";

    @Test
    public void integrationTest() throws Exception {
        System.out.println("RDF model build and export");
        // MutableBoolean that serves as a flag of the "pass" state to the test 
        // framework. Mutable shared state because of the accursed streams 
        // framework in the file tree walker.
        File gitDir = new File("." + File.separator + "laws-lois-xml");
        Set<String> knownStatutoryInstruments = new TreeSet<>();
        System.err.println();
        // This is the MapDB instance for storing the attribute sets collected 
        // for the full-text search index. The given settings are geared to 
        // going as fast as possible on a single thread. Enable concurrency if
        // you're going to split the assembly process into a thread pool.
        DB db = org.mapdb.DBMaker.fileDB(MAPDB_BUILD_PATH)
                .closeOnJvmShutdown()
                .fileDeleteAfterClose()
                .concurrencyDisable()
                .fileMmapPreclearDisable()
                .fileMmapEnableIfSupported()
                .make();
        // Map to hold attribute sets that will be put in the search index. The 
        // top-level keys are to be fully-qualified URIs that jive with the 
        // subjects in the Jena Model. The URIs will be shortened to match the 
        // Jena ones at serialization time.
        Map<String, Map<String, String>> searchIndex = db.hashMap("searchindex", Serializer.STRING_ASCII, Serializer.JAVA).createOrOpen();
        Model model = ModelFactory.createDefaultModel();
        RdfGatheringAgent agent = new RdfGatheringAgent();
        // Add local facts and prefixes to the model.
        boolean pass = agent.fetchAndParseLocalTriples(new File("rdf"), model);


        // Try to pull the latest Acts & Regs from GitHub
        agent.cacheActsAndRegsFromGitHub(gitDir);

      knownStatutoryInstruments.addAll(agent.fetchAndParseStatutoryInstruments(model));

        // Add local facts and prefixes to the model.
        agent.fetchAndParseDepartments(model, searchIndex);

        // Add the RIAS facts to the model.
        agent.fetchAndParseRias(model, knownStatutoryInstruments);

        // Add the acts and regs facts to the model.
        agent.fetchAndParseActsAndConsolidatedRegs(model, knownStatutoryInstruments, searchIndex, gitDir);
        
        // Add the Metadata facts to the model.
        agent.fetchAndParseMetadata(model);

        // Add the Orders-In-Council facts to the model.
        agent.fetchAndParseOrdersInCouncil(model, searchIndex, 2500);

        Assertions.assertTrue(pass, "RDF parsing errors occurred.");
        System.out.println("Parsed " + model.size() + " triples.");

        // Write the whole model out as a turtle file.
        try ( OutputStream ttlOutputStream = new FileOutputStream(TTL_BUILD_PATH)) {
            model.write(ttlOutputStream, "TTL");
            ttlOutputStream.flush();
        }

        // Write the model out as the WASM-SQLite DB
        agent.writeModelToSqlite(model, SQLITE_BUILD_PATH);
        // Write the index out as SOLR-formatted JSON
        agent.writeIndexToJson(searchIndex, new File(INDEX_BUILD_PATH));
    }

}
