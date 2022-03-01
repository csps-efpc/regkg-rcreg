package ca.gc.csps.regkg.anomaly;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 *
 * @author jturner
 */
public class SimpleAnomalyReporterImpl implements IAnomalyReporter {

    protected final Map<String, Set<String>> store = new TreeMap<>();

    @Override
    public synchronized void report(String subject, String message) {
        Set<String> list = store.get(subject);
        if (list == null) {
            list = new TreeSet<>();
            store.put(subject, list);
        }
        list.add(message);
    }

    @Override
    public void writeReport(OutputStream os) throws IOException {
        try (OutputStreamWriter osw = new OutputStreamWriter(os, StandardCharsets.UTF_8)) {
            for (Entry<String, Set<String>> entry : store.entrySet()) {
                osw.write(entry.getKey());
                osw.write("\n");
                for (String message : entry.getValue()) {
                    osw.write("  ");
                    osw.write(message);
                    osw.write("\n");
                }
            }
        } catch (IOException ex) {
            throw ex;
        }
    }
}
