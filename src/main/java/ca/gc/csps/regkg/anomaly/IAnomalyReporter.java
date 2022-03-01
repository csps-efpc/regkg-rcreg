package ca.gc.csps.regkg.anomaly;

import java.io.IOException;
import java.io.OutputStream;

/**
 * Interface describing a service to which a knowledge graph anomaly can be
 * reported.
 *
 * @author jturner
 */
public interface IAnomalyReporter {

    /**
     * Report an anomaly discovered when trying to assemble a triple
     *
     * @param subject the subject of the anomaly -- this can either be an RDF
     * reference or a URL from which parsing failed.
     * @param message a descriptive message of the anomaly
     */
    void report(String subject, String message);

    /**
     * Writes a report of the set of discovered anomalies to the given output
     * stream.
     *
     * @param os The stream to which te report should be written.
     * @throws IOException if an exception 
     */
    void writeReport(OutputStream os) throws IOException;
}
