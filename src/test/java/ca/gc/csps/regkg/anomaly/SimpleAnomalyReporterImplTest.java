package ca.gc.csps.regkg.anomaly;

import java.io.File;
import java.io.FileOutputStream;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 *
 * @author jturner
 */
public class SimpleAnomalyReporterImplTest {

    public SimpleAnomalyReporterImplTest() {
    }

    /**
     * Test of writeReport method, of class SimpleAnomalyReporterImpl.
     */
    @Test
    public void testWriteReport() throws Exception {
        System.out.println("writeReport");
        File work = File.createTempFile("regkg", "tmp");
        String subject = "foo";
        String[] messages = new String[]{"bar", "baz", "pomme"};
        SimpleAnomalyReporterImpl instance = new SimpleAnomalyReporterImpl();
        for (String message : messages) {
            instance.report(subject, message);
        }
        try (FileOutputStream fos = new FileOutputStream(work)) {
            for (String message : messages) {
                instance.report(subject, message);
            }
            instance.writeReport(fos);
            fos.flush();
            fos.close();
        } finally {
            work.deleteOnExit();
        }
        String reportString = FileUtils.readFileToString(work, "UTF-8");
        for (String message : messages) {
            assertTrue(reportString.contains(message), "Searching for message "+ message + " in output");
        }
    }

}
