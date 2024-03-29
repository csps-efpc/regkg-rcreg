package ca.gc.csps.regkg;

import ca.gc.csps.regkg.anomaly.IAnomalyReporter;
import ca.gc.csps.regkg.anomaly.SimpleAnomalyReporterImpl;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.mutable.MutableBoolean;
import org.apache.jena.datatypes.xsd.impl.XSDDateType;
import org.apache.jena.rdf.model.AnonId;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.RDFVisitor;
import org.apache.jena.rdf.model.ResIterator;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;
import org.apache.jena.rdf.model.Statement;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.rdf.model.impl.PropertyImpl;
import org.apache.jena.riot.RDFParser;
import org.apache.jena.riot.system.ErrorHandler;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.jdom2.Content;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.JDOMException;
import org.jdom2.Namespace;
import org.jdom2.input.SAXBuilder;
import org.jsoup.Jsoup;
import org.jsoup.nodes.TextNode;
import org.jsoup.select.Elements;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.htmlunit.HtmlUnitDriver;

/**
 *
 * @author jturner
 */
public class RdfGatheringAgent {

    private static final String JUSTICE_LAWS_GIT = "https://github.com/justicecanada/laws-lois-xml.git";

    private static final String STATUTORY_INSTRUMENT_PREFIX = "https://www.canada.ca/en/privy-council/ext/statutory-instrument/";
    private static final String ORDER_IN_COUNCIL_PREFIX = "https://orders-in-council.canada.ca/";
    private static final String ORG_ID_PREFIX = "https://www.tpsgc-pwgsc.gc.ca/recgen/orgid/";

    private static final String ANNUAL_STATUTES_ENGLISH_URL = "https://laws-lois.justice.gc.ca/eng/AnnualStatutes/index.html";
    private static final String LEGIS_URL = "https://laws-lois.justice.gc.ca/eng/XML/Legis.xml";
    private static final String ORDER_IN_COUNCIL_URL_ENGLISH = "https://orders-in-council.canada.ca/";
    private static final String ORDER_IN_COUNCIL_URL_FRENCH = "https://decrets.canada.ca/";
    private static final String CONSOLIDATED_INDEX_OF_STATUTORY_INSTRUMENTS_ENGLISH_URL
            = "https://www.gazette.gc.ca/rp-pr/p2/2023/2023-06-30-c2/?-eng.html";
    private static final String CG_PART_II_ENGLISH_URL = "https://gazette.gc.ca/rp-pr/publications-eng.html";

    private static final String ACT_CLASS_URI = "https://canada.ca/ext/act-loi";
    private static final String REG_CLASS_URI = "https://canada.ca/ext/regulation-reglement";
    private static final String OIC_CLASS_URI = "https://canada.ca/ext/orderincouncil-decret";

    private static final String ACT_TYPE_VALUE = "act";
    private static final String REG_TYPE_VALUE = "regulation";
    private static final String OIC_TYPE_VALUE = "oic";

    private static final String TEXT_FIELD_ENGLISH = "text_en_txt";
    private static final String TEXT_FIELD_FRENCH = "text_fr_txt";
    private static final String TITLE_FIELD_ENGLISH = "title_en_txt";
    private static final String TITLE_FIELD_FRENCH = "title_fr_txt";
    private static final String LINK_FIELD_ENGLISH = "url_en_s";
    private static final String LINK_FIELD_FRENCH = "url_fr_s";
    private static final String TYPE_FIELD = "type_s";

    private static final Charset UTF8 = StandardCharsets.UTF_8;

    private static final String REFERENCE_CHAPTER_MARKER = ", c. ";
    private static final String REFERENCE_SECTION_MARKER = ", s. ";
    private static final String REFERENCE_SECTIONS_MARKER = ", ss. ";
    private static final String OTHER_THAN_STATUTORY_AUTHORITY = "Other Than Statutory Authority";
    private static final String NONE_STATUTORY_AUTHORITY = "None";

    // Declare the set of predicates that we'll be generating programmatically. The justice ones are all made-up.
    final PropertyImpl legislationIdentifierProperty = new PropertyImpl("https://schema.org/legislationIdentifier");
    final PropertyImpl sponsorProperty = new PropertyImpl("https://www.gazette.gc.ca/ext/sponsor");
    final PropertyImpl consultationWordCountProperty = new PropertyImpl("https://www.gazette.gc.ca/ext/consultation-word-count");
    final PropertyImpl wordCountProperty = new PropertyImpl("https://schema.org/wordCount");
    final PropertyImpl sectionCountProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/section-count");
    final PropertyImpl cbaWordCountProperty = new PropertyImpl("https://www.gazette.gc.ca/ext/cba-word-count");
    final PropertyImpl riasWordCountProperty = new PropertyImpl("https://www.gazette.gc.ca/ext/rias-word-count");
    final PropertyImpl enablingActProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/enabling-act");
    final PropertyImpl legislationAmendsProperty = new PropertyImpl("https://schema.org/legislationChanges");
    final PropertyImpl orderImplementsProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/order-implements");
    final PropertyImpl enablingOrderProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/enabling-order");
    final PropertyImpl consolidatesProperty = new PropertyImpl("https://schema.org/legislationConsolidates");
    final PropertyImpl enablesRegProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/enables-regulation");
    final PropertyImpl nameProperty = new PropertyImpl("https://schema.org/name");
    final PropertyImpl urlProperty = new PropertyImpl("https://schema.org/url");
    final PropertyImpl orgnameProperty = new PropertyImpl("https://www.tpsgc-pwgsc.gc.ca/recgen/ext/org-name");
    final PropertyImpl departmentHeadProperty = new PropertyImpl("https://www.tpsgc-pwgsc.gc.ca/recgen/ext/department-head");
    final PropertyImpl metadataLabelProperty = new PropertyImpl("https://www.csps-efpc.gc.ca/ext/instrument-references");
    final PropertyImpl legislationDateProperty = new PropertyImpl("https://schema.org/legislationDate");
    final PropertyImpl rdfTypeProperty = new PropertyImpl("rdf:Type");

    private IAnomalyReporter anomalies = new SimpleAnomalyReporterImpl();

    /**
     * Recursively read local files into the given model.
     *
     * @param root the file path from which to start searching for .csv, .ttl
     * and .nt files
     * @param model the RDF model into which triples and namespaces should be
     * inserted
     * @throws IOException if an error occurs while recursing and reading.
     * @return true if all files were successfully parsed and no unknown files
     * were discovered.
     */
    public boolean fetchAndParseLocalTriples(File root, Model model) throws IOException {
        MutableBoolean pass = new MutableBoolean(true);
        // Iterate through the "rdf" directory for turtle files.
        // Manually-coded facts and shorthand prefixes can be declared in the turtle.
        CsvToRdfParser csvParser = new CsvToRdfParser();
        Files.walk(root.toPath()).filter(path -> Files.exists(path, LinkOption.NOFOLLOW_LINKS)).filter(path -> path.toFile().isFile()).forEach(path -> {
            ErrorHandler handler = new RdfParsingErrorHandler(pass, path);
            switch (FilenameUtils.getExtension(path.toString())) {
                case "ttl", "nt" ->
                    RDFParser.source(path).checking(true).errorHandler(handler).build().parse(model);
                case "csv" -> {
                    try {
                        csvParser.parse(path.toFile(), model);
                    } catch (IOException ex) {
                        Logger.getLogger(RdfGatheringAgent.class.getName()).log(Level.SEVERE, null, ex);
                        pass.setFalse();
                    }
                }
                default -> {
                    System.err.println("ERROR: Unexpected file extension at " + path);
                    pass.setFalse();
                }
            }
        });
        return pass.isTrue();
    }

    /**
     * Writes the given index into a JSON file at the given path. If an existing
     * is found, it is deleted.
     *
     * @param index the index to write
     * @param targetFile the file path to which the JSON should be written
     * @throws IOException if any part of the write operation fails.
     */
    public void writeIndexToJson(Map<String, Map<String, String>> index, File targetFile) throws IOException {
        if (targetFile.exists()) {
            Files.delete(targetFile.toPath());
        }
        Gson gson = new GsonBuilder().create();
        try ( FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write("[\n".getBytes(UTF8));
            Iterator<Map.Entry<String, Map<String, String>>> it = index.entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry<String, Map<String, String>> entry = it.next();
                TreeMap<String, String> value = new TreeMap(entry.getValue());
                value.put("id", entry.getKey());
                fos.write(gson.toJson(value).getBytes(UTF8));
                if (it.hasNext()) {
                    fos.write(",".getBytes(UTF8));
                }
                fos.write("\n".getBytes(UTF8));
            }
            fos.write("]".getBytes(UTF8));
            fos.flush();
            fos.close();
        }
    }

    /**
     * Writes the given RDF model out to a SQLite3 database. URI values are
     * written in RDF short-form.
     *
     * @param model the model to write.
     * @param path the file path to which the model should be written.
     * @throws IOException if the writing of the model to disk fails.
     */
    @SuppressFBWarnings(value = "SQL_INJECTION_JDBC", justification = "The strings in question are loaded from files in the app resources.")
    public void writeModelToSqlite(Model model, String path) throws IOException {
        // Write the given model out to a nicely-packed SQLite db.
        // Setup DDL/SQL is pulled from a resource called "/ddl.sql"
        // Optimization is pulled from a resource called "finalize.sql"
        try {
            try ( Connection conn = DriverManager.getConnection("jdbc:sqlite:" + path)) {
                try ( java.sql.Statement stmt = conn.createStatement()) {
                    String ddlFile = IOUtils.toString(getClass().getResourceAsStream("/ddl.sql"), "UTF-8");
                    String lines[] = ddlFile.split("\\r?\\n");
                    for (String line : lines) {
                        stmt.execute(line);
                    }
                }
                conn.setAutoCommit(false);
                try ( PreparedStatement stmt = conn.prepareStatement("INSERT INTO TRIPLES (SUBJECT, OBJECT, PREDICATE) VALUES (?, ?, ?)")) {
                    StmtIterator stmts = model.listStatements();
                    while (stmts.hasNext()) {
                        Statement triple = stmts.nextStatement();
                        String rdfObject = (String) triple.getObject().visitWith(new RDFVisitor() {
                            @Override
                            public Object visitBlank(Resource r, AnonId id) {
                                return id.toString();
                            }

                            @Override
                            public Object visitURI(Resource r, String uri) {
                                return model.shortForm(uri);
                            }

                            @Override
                            public Object visitLiteral(Literal l) {
                                return "\"" + l.getLexicalForm() + "\"";
                            }
                        });
                        if (triple.getSubject().getURI() != null && triple.getPredicate().getURI() != null) {
                            stmt.setString(1, model.shortForm(triple.getSubject().getURI()));
                            stmt.setString(2, rdfObject);
                            stmt.setString(3, model.shortForm(triple.getPredicate().getURI()));
                            stmt.execute();
                        }
                    }

                    stmt.execute();
                }
                for (Map.Entry<String, String> entry : model.getNsPrefixMap().entrySet()) {
                    try ( PreparedStatement stmt = conn.prepareStatement("INSERT INTO PREFIXES (PREFIX, URL) VALUES (?, ?)")) {
                        stmt.setString(1, entry.getKey());
                        stmt.setString(2, entry.getValue());
                        System.out.println(entry.getKey() + " -> " + entry.getValue());
                        stmt.execute();
                    }
                }
                conn.commit();
                conn.setAutoCommit(true);
                try ( java.sql.Statement stmt = conn.createStatement()) {
                    String ddlFile = IOUtils.toString(getClass().getResourceAsStream("/finalize.sql"), "UTF-8");
                    String lines[] = ddlFile.split("\\r?\\n");
                    for (String line : lines) {
                        stmt.execute(line);
                    }
                }
            }
        } catch (SQLException ex) {
            Logger.getLogger(RdfGatheringAgent.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    /**
     * Read the list of federal departments from a CSV document, convert the
     * tuples to triples, and insert them into the RDF model and a search index.
     *
     * @param model the RDF model into which the departments should be added.
     * @param searchIndex the index into which to add the departments
     * @throws IOException
     */
    public void fetchAndParseDepartments(Model model, Map<String, Map<String, String>> searchIndex) throws IOException {
        try ( FileReader in = new FileReader("csv" + File.separator + "departments.csv", StandardCharsets.UTF_8)) {
            Iterable<CSVRecord> records = org.apache.commons.csv.CSVFormat.Builder
                    .create(CSVFormat.DEFAULT)
                    .setHeader()
                    .setIgnoreSurroundingSpaces(true)
                    .setNullString("")
                    .build().parse(in);
            for (CSVRecord record : records) {
                String resourceURI = ORG_ID_PREFIX + record.get("ORG_ID").trim();
                final Resource subject = ResourceFactory.createResource(resourceURI);
                StringBuilder textEn = new StringBuilder();
                StringBuilder textFr = new StringBuilder();
                Map<String, String> index = searchIndex.getOrDefault(resourceURI, new HashMap<>());
                if (record.get("ORGNAME_EN") != null && !record.get("ORGNAME_EN").trim().isEmpty()) {
                    model.add(subject, orgnameProperty, record.get("ORGNAME_EN"));
                    textEn.append(record.get("ORGNAME_EN"));
                    textEn.append(" ");
                }
                if (record.get("ORGNAME_FR") != null && !record.get("ORGNAME_FR").trim().isEmpty()) {
                    model.add(subject, orgnameProperty, record.get("ORGNAME_FR"), "fr");
                    textFr.append(record.get("ORGNAME_FR"));
                    textFr.append(" ");
                }
                if (record.get("DEPT_HEAD_EN") != null && !record.get("DEPT_HEAD_EN").trim().isEmpty()) {
                    model.add(subject, departmentHeadProperty, record.get("DEPT_HEAD_EN"));
                    textEn.append(record.get("DEPT_HEAD_EN"));
                    textEn.append(" ");
                }
//            if (record.get("DEPT_HEAD_FR") != null && !record.get("DEPT_HEAD_FR").trim().isEmpty()) {
////                model.add(subject, departmentHeadProperty, record.get("DEPT_HEAD_FR"));
//                textFr.append(record.get("DEPT_HEAD_FR"));
//                textFr.append(" ");
//            }
                index.put(TEXT_FIELD_ENGLISH, textEn.toString().trim());
                index.put(TEXT_FIELD_FRENCH, textFr.toString().trim());
                searchIndex.put(resourceURI, index);
            }
        }
    }

    public void fetchAndParseMetadata(Model model) throws IOException {
        File file = new File("metadata.csv");
        if (file.exists()) {
            try ( FileReader in = new FileReader(file, StandardCharsets.UTF_8)) {
                Iterable<CSVRecord> records = org.apache.commons.csv.CSVFormat.Builder.create(CSVFormat.DEFAULT).setHeader().build().parse(in);
                for (CSVRecord record : records) {
                    final Resource subject = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(record.get("instrument_number")));
                    if (record.get("category_item_desc_en") != null && !record.get("category_item_desc_en").isEmpty()) {
                        model.add(subject, metadataLabelProperty, record.get("category_item_desc_en"));
                    }
                }
            }
        }
    }

    public void fetchAndParseRias(Model model, Set<String> knownStatutoryInstruments) throws IOException {
        // Parse the regacan set from UQAM. Need to find a long-term home for this.
        File file = new File("regcan.csv");
        if (file.exists()) {
            try ( FileReader in = new FileReader(file, StandardCharsets.UTF_8)) {
                Iterable<CSVRecord> records = org.apache.commons.csv.CSVFormat.Builder.create(CSVFormat.DEFAULT).setHeader().build().parse(in);
                for (CSVRecord record : records) {
                    // The "SOR" identifiers Justice uses in their URLs are mangled, because the real strings use reserved URL characters.
                    final Resource subject = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(record.get("ID")));
                    knownStatutoryInstruments.add(toUrlSafeId(record.get("ID")));
                    String regText = record.get("regtext");
                    String id = record.get("ID");
                    if (regText.startsWith("Registration ")) {
                        regText = regText.substring(13);
                    }
                    if (regText.startsWith(id)) {
                        regText = regText.substring(id.length());
                    }
                    if (regText.contains(" P.C. ")) {
                        int startIndex = 0;
                        if (regText.contains("ACT") && regText.indexOf("ACT") < regText.indexOf(" P.C. ")) {
                            startIndex = regText.indexOf("ACT") + 3;
                        }
                        model.add(subject, nameProperty, regText.substring(startIndex, regText.indexOf(" P.C. ")).trim(), "en");
                    }
                    model.add(subject, sponsorProperty, record.get("sponsor"));
                    model.add(subject, cbaWordCountProperty, record.get("CBA.wordcount"));
                    model.add(subject, riasWordCountProperty, record.get("rias.wordcount"));
                    model.add(subject, consultationWordCountProperty, record.get("consultation.wordcount"));
                }
            }
        }
    }

    public void fetchAndParseAnnualStatutes(Model model, Map<String, Map<String, String>> searchIndex) throws JDOMException, IOException {
        URL u = new URL(ANNUAL_STATUTES_ENGLISH_URL);
        org.jsoup.nodes.Document doc = Jsoup.parse(u, 10000);
        Elements links = doc.body().select("div[role='navigation'] a");
        for (String href : links.eachAttr("href")) {
            URL u2 = new URL(u, href);
            org.jsoup.nodes.Document doc2 = Jsoup.parse(u2, 10000);
            Elements links2 = doc2.select("div[class='contentBlock'] a");
            for (String href2 : links2.eachAttr("href")) {

                URL u3 = new URL(u2, href2 + "/FullText.html");
                URL u4 = new URL(u3.toExternalForm().replace("eng/AnnualStatutes", "fra/LoisAnnuelles").replace("FullText.html", "TexteComplet.html"));
                Resource subject = null;
                Map<String, String> index = new HashMap<>();
                try {
                    org.jsoup.nodes.Document doc3 = Jsoup.parse(u3, 10000);
                    String title_en = doc3.selectFirst(".Title-of-Act").text();
                    String chapterNumber_en = doc3.selectFirst(".ChapterNumber").text();
                    String id = toUrlSafeId(chapterNumber_en);
                    subject = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + id);

                    model.add(subject, rdfTypeProperty,
                            ResourceFactory.createResource(ACT_CLASS_URI));
                    index = searchIndex.getOrDefault(subject.getURI(), new HashMap<>());
                    index.put(TYPE_FIELD, ACT_TYPE_VALUE);
                    String text_en = doc3.selectFirst(".docContents").text();
                    model.add(subject, nameProperty, title_en, "en");
                    model.add(subject, urlProperty, u3.toExternalForm(), "en");
                    model.add(subject, legislationIdentifierProperty, chapterNumber_en, "en");
                    // The statutes are not expressed in the esrch index, as the entity sought
                    // is almost certainly the consolidated form.
                    //index.put(TEXT_FIELD_ENGLISH, text_en);
                    //index.put(TITLE_FIELD_ENGLISH, title_en);
                    //index.put(LINK_FIELD_ENGLISH, u3.toExternalForm());

                    org.jsoup.nodes.Document doc4 = Jsoup.parse(u4, 10000);
                    String title_fr = doc4.selectFirst(".Title-of-Act").text();
                    String chapterNumber_fr = doc4.selectFirst(".ChapterNumber").text();
                    String text_fr = doc4.selectFirst(".docContents").text();
                    System.out.println("" + subject.getURI() + " - " + title_en + " - " + title_fr);
                    model.add(subject, nameProperty, title_fr, "fr");
                    model.add(subject, urlProperty, u4.toExternalForm(), "fr");
                    model.add(subject, legislationIdentifierProperty, chapterNumber_fr, "fr");
                    //index.put(TEXT_FIELD_FRENCH, text_fr);
                    //index.put(TITLE_FIELD_FRENCH, title_fr);
                    //index.put(LINK_FIELD_FRENCH, u4.toExternalForm());

                } catch (Exception ex) {
                    Logger.getLogger(RdfGatheringAgent.class.getName()).log(Level.SEVERE, null, ex);
                }
                if (subject != null) {
                    searchIndex.put(subject.getURI(), index);
                }
            }
        }
    }

    /**
     * Insert the Consolidated Index of Statutory Instruments from the Canada
     * Gazette into the given model. This implementation is messy; the regs
     * around reg identifiers disagree between french and english, and the index
     * is asymmetrical as a result.
     *
     * @param model The RDF model into which the triples should be added.
     * @return the set of statutory instrument IDs discovered during the
     * insertion operation.
     * @throws JDOMException if the published index at the Canada Gazette cannot
     * be parsed.
     * @throws IOException if the connection to the Canada Gazette cannot be
     * established.
     */
    @SuppressFBWarnings(value = "DCN_NULLPOINTER_EXCEPTION", justification = "This screen-scraping technique is known to be brittle.")
    public Set<String> fetchAndParseStatutoryInstruments(Model model) throws JDOMException, IOException {
        Set<String> knownStatutoryInstrumentIds = new HashSet<>();
        try {
            Map<String, String> statutoryInstruments = new TreeMap<>();
            String[] sections = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,other-autre".split(",");
            for (String section : sections) {
                URL u = new URL(CONSOLIDATED_INDEX_OF_STATUTORY_INSTRUMENTS_ENGLISH_URL.replace("?", section));
                Logger.getLogger(RdfGatheringAgent.class
                        .getName()).log(Level.INFO, "Fetching {0}", u.toExternalForm());
                try {
                    org.jsoup.nodes.Document doc = Jsoup.parse(u, 10000);
                    Elements h2 = doc.body().select("h2");
                    for (String text : h2.eachText()) {
                        if (text.contains("[") && text.contains("]")) {
                            String instrument = toUrlSafeId(text.substring(text.indexOf("[") + 1, text.indexOf("]")).trim());
                            String name = text.replaceAll("\\[(^])*\\]", "").trim();
                            statutoryInstruments.put(instrument, name);
                        }
                    }
                    Elements actOrdCatEng = doc.body().select("span.actOrdCatEng");
                    for (org.jsoup.nodes.Element el : actOrdCatEng) {
                        for (String text : el.parent().select("span.actOrdEng").eachText()) {
                            if (text.contains("C.R.C.,")) {
                                String instrument = toUrlSafeId(text.substring(text.lastIndexOf("C.R.C.,")).trim());
                                String name = el.text() + " " + text.substring(0, text.lastIndexOf("C.R.C.,")).replaceAll("\\s+", " ").trim();
                                statutoryInstruments.put(instrument, name);
                            } else if (text.contains(",")) {
                                String instrument = toUrlSafeId(text.substring(text.lastIndexOf(",") + 1).trim());
                                String name = el.text() + " " + text.substring(0, text.lastIndexOf(",")).replaceAll("\\s+", " ").trim();
                                statutoryInstruments.put(instrument, name);
                            }

                        }
                    }
                    Elements actRegEngNoBold = doc.body().select("li.actRegEngNoBold");
                    for (org.jsoup.nodes.Element el : actRegEngNoBold) {
                        String text = el.selectFirst("strong").text();
                        if (text.contains("C.R.C.,")) {
                            String instrument = toUrlSafeId(text.substring(text.lastIndexOf("C.R.C.,")).trim());
                            String name = text.substring(0, text.lastIndexOf("C.R.C.,")).replaceAll("\\s+", " ").trim();
                            statutoryInstruments.put(instrument, name);
                            knownStatutoryInstrumentIds.add(instrument);
                        } else if (text.contains(",")) {
                            String instrument = toUrlSafeId(text.substring(text.lastIndexOf(",") + 1).trim());
                            String name = text.substring(0, text.lastIndexOf(",")).replaceAll("\\s+", " ").trim();
                            statutoryInstruments.put(instrument, name);
                            knownStatutoryInstrumentIds.add(instrument);
                        }
                    }
                } catch (IOException ex) {
                    anomalies.report(u.toExternalForm(), "Could not be loaded: " + ex.getMessage());
                    Logger.getLogger(RdfGatheringAgent.class
                            .getName()).log(Level.WARNING, "Failed to fetch " + u.toExternalForm(), ex);
                }
            }
            for (Map.Entry<String, String> entry : statutoryInstruments.entrySet()) {
                //            System.out.println("[" + entry.getKey() + "] " + entry.getValue());
                if (entry.getKey().startsWith("C.R.C.")
                        || entry.getKey().startsWith("R.S.C._")
                        || entry.getKey().startsWith("R.S._")
                        || entry.getKey().startsWith("S.C._")
                        || entry.getKey().startsWith("SI-")
                        || entry.getKey().startsWith("SOR-")) {
                    model.add(ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(entry.getKey())), this.nameProperty, String.valueOf(entry.getValue()), "en");
                } else {
                    anomalies.report(CONSOLIDATED_INDEX_OF_STATUTORY_INSTRUMENTS_ENGLISH_URL, "Unparsable Instrument: [" + entry.getKey() + "] " + entry.getValue());
                    System.out.println("Unparsable instrument: [" + entry.getKey() + "] " + entry.getValue());
                }
            }
        } catch (NullPointerException e) {
            e.printStackTrace();
            throw new IOException(e);
        }
        return knownStatutoryInstrumentIds;
    }

    private void fetchAndParseConsolidatedStatutoryInstrument(Model model, String instrumentId, Set<String> statutoryInstrumentIds, Map<String, Map<String, String>> searchIndex, File gitDir) throws JDOMException, IOException {
        final Resource instrumentURI = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + instrumentId);
        SAXBuilder builder = new SAXBuilder();
        Document engDoc = fetchDoc(gitDir, instrumentId, builder, "eng");
        String frenchId = toUrlSafeId(model.getProperty(instrumentURI, legislationIdentifierProperty, "fr").getString());
        Document fraDoc = fetchDoc(gitDir, frenchId, builder, "fra");

        // At this point we either have the documents, or have thrown an exception.
        String enUrl = null;
        Statement enUrlProperty = model.getProperty(instrumentURI, urlProperty, "en");
        if (enUrlProperty != null) {
            enUrl = enUrlProperty.getString();
        }
        String frUrl = null;
        Statement frUrlProperty = model.getProperty(instrumentURI, urlProperty, "fr");
        if (frUrlProperty != null) {
            frUrl = frUrlProperty.getString();
        }
        int sectionCount = 0;

        indexConsolidatedInstrument(engDoc, model, instrumentURI, instrumentId, searchIndex, "en", enUrl);
        indexConsolidatedInstrument(fraDoc, model, instrumentURI, frenchId, searchIndex, "fr", frUrl);
        TreeSet<String> amendingRegIds = new TreeSet<>();
        for (Element identificationElement : engDoc.getRootElement().getChildren("Identification")) {
            for (Element regMakerOrderElement : identificationElement.getChildren("RegulationMakerOrder")) {
                if (regMakerOrderElement.getChildText("RegulationMaker") != null && regMakerOrderElement.getChildText("RegulationMaker").equals("P.C.")) {
                    String orderNumber = normalizeOICNumber(regMakerOrderElement.getChildText("OrderNumber"));
                    final Resource orderURI = ResourceFactory.createResource(ORDER_IN_COUNCIL_PREFIX + orderNumber);
                    model.add(orderURI, orderImplementsProperty, instrumentURI);
                    model.add(instrumentURI, enablingOrderProperty, orderURI);
                }
            }
        }
        final Element bodyElement = engDoc.getRootElement().getChild("Body");
        if (bodyElement != null) {
            for (Element section : bodyElement.getChildren("Section")) {
                sectionCount++;
                for (Element historicalNote : section.getChildren("HistoricalNote")) {
                    for (Element historicalNoteSubItem : historicalNote.getChildren("HistoricalNoteSubItem")) {
                        String[] items = collectTextFrom(historicalNoteSubItem).toString().split(";");
                        for (String item : items) {
                            item = item.trim();
                            String ref = item;
                            String refSection = null;
                            String refChapter = null;
                            if (ref.contains(REFERENCE_CHAPTER_MARKER)) {
                                // These ones are almost always shorthand for the statutes?
                                refChapter = ref.substring(ref.indexOf(REFERENCE_CHAPTER_MARKER) + REFERENCE_CHAPTER_MARKER.length()).trim();
                                if (refChapter.contains(",")) {
                                    refChapter = refChapter.substring(0, refChapter.indexOf(",")).trim();
                                }
                                ref = ref.substring(0, ref.indexOf(REFERENCE_CHAPTER_MARKER)).trim();
                            } else if (ref.contains(REFERENCE_SECTION_MARKER)) {
                                refSection = ref.substring(ref.indexOf(REFERENCE_SECTION_MARKER) + REFERENCE_SECTION_MARKER.length()).trim();
                                ref = ref.substring(0, ref.indexOf(REFERENCE_SECTION_MARKER)).trim();
                            } else if (ref.contains(REFERENCE_SECTIONS_MARKER)) {
                                refSection = ref.substring(ref.indexOf(REFERENCE_SECTIONS_MARKER) + REFERENCE_SECTIONS_MARKER.length()).trim();
                                ref = ref.substring(0, ref.indexOf(REFERENCE_SECTIONS_MARKER)).trim();
                            }
                            if (ref.matches("\\d{4}") && refChapter != null && refChapter.matches("\\d+")) { // It's one of the annual statutes.
                                amendingRegIds.add("S.C._" + ref + ",c._" + refChapter);
                            } else if (statutoryInstrumentIds.contains(toUrlSafeId(ref))) {
                                amendingRegIds.add(toUrlSafeId(ref));
                            } else {
                                // We may have to come up with a routine to figure out the shorthand that got used here.
                                // System.out.println("Unknown reference to amending instrument: " + toUrlSafeId(ref) + " from (" + ref + ")");
                                anomalies.report(instrumentURI.getURI(), "Unknown Reference to amending instrument: " + ref);
                            }
                        }
                    }
                }
            }
        }
        for (String amendingRegId : amendingRegIds) {
            final Resource amendingReg = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(amendingRegId));
            model.add(amendingReg, legislationAmendsProperty, instrumentURI);
        }
        model.add(instrumentURI, sectionCountProperty, String.valueOf(sectionCount));
    }

    /**
     * Converts PC numbers to Order-In-Council IDs. In various parts of the
     * regulatory corpus, the OIC numbers are changed into "P.C." numbers which
     * don't conform to the OIC format.
     *
     * @param orderNumber a PC or OIC number
     * @return an OIC identifier.
     * @throws NumberFormatException if the input's sequence part can't be
     * parsed as an integer.
     */
    String normalizeOICNumber(String orderNumber) throws NumberFormatException {
        // There are em-dashes in the data.
        orderNumber = orderNumber.replace('–', '-');
        // Whitelist regex is necessary becuase the justice XML has stray characters.
        orderNumber = orderNumber.replaceAll("[^0-9\\-]", "");
        // We have to massage the order numbers because of the difference between PC numbers and the actual OIC identfiers.
        String[] parts = orderNumber.split("-");
        orderNumber = parts[0].trim() + "-" + String.format("%04d", Integer.parseInt(parts[1]));
        return orderNumber;
    }

    @SuppressFBWarnings(value = "PATH_TRAVERSAL_IN", justification = "the lang value is checked against a whitelist")
    private Document fetchDoc(File gitDir, String instrumentId, SAXBuilder builder, String lang) throws IOException, JDOMException {
        // The following set of checks and fallbacks is there to address the
        // case where the published legis.xml document is out of sync with the
        // GitHub contents, or where the GitHub content is
        // truncated/faulty/whatever
        if (!(lang.equals("eng") || lang.equals("fra"))) {
            throw new IOException("Unexpected langugage code: " + lang);
        }
        File gitFile = null;
        if (gitDir != null) {
            File langFile = new File(gitDir, lang);
            File acts = new File(langFile, (lang.equals("fra") ? "lois" : "acts"));
            File regs = new File(langFile, (lang.equals("fra") ? "reglements" : "regulations"));
            if (new File(acts, instrumentId + ".xml").exists()) {
                gitFile = new File(acts, instrumentId + ".xml");
            } else if (new File(regs, instrumentId + ".xml").exists()) {
                gitFile = new File(regs, instrumentId + ".xml");
            }
        }
        Document doc = null;
        if (gitFile != null) {
            try {
                System.out.println(gitFile.getPath());
                doc = builder.build(gitFile);
            } catch (IOException | JDOMException ex) {
                anomalies.report(gitFile.toURI().toASCIIString(), "Failed to parse: " + ex.getMessage());
                Logger.getLogger(RdfGatheringAgent.class
                        .getName()).log(Level.WARNING, "Failed to parse " + gitFile.getPath(), ex);
            }
        }
        if (doc == null) {
            final String xmlUrl = "https://laws-lois.justice.gc.ca/" + lang + "/XML/" + instrumentId + ".xml";
            System.out.println(xmlUrl);
            doc = builder.build(xmlUrl);
        }
        return doc;
    }

    private void addLimsSectionToIndex(Namespace limsNamespace, Element section, final Resource instrumentURI, Map<String, Map<String, String>> searchIndex, String textField, String titleField, String shortTitle, String urlString, String linkField, String type) {
        if (limsNamespace != null) {
            String limsId = section.getAttributeValue("id", limsNamespace);
            if (limsId != null) {
                String sectionURI = instrumentURI.getURI() + "#" + limsId;
                Map<String, String> sectionindex = searchIndex.getOrDefault(sectionURI, new HashMap<>());
                sectionindex.put(textField, collectTextFrom(section).toString());
                sectionindex.put(titleField, shortTitle);
                sectionindex.put(TYPE_FIELD, type);
                if (urlString != null) {
                    sectionindex.put(linkField, urlString + "#" + limsId);
                }
                searchIndex.put(sectionURI, sectionindex);
            }
        }
    }

    public void cacheActsAndRegsFromGitHub(File gitDir) throws IOException {
        //Use Git to fetch the latest from Justice.
        try {
            if (gitDir.exists()) {
                Logger.getLogger(RdfGatheringAgent.class
                        .getName()).log(Level.INFO, "Local copy of Acts & Regs found, refreshing changes from GitHub.");
                Git git = Git.open(gitDir);
                git.pull().call();
            } else {
                Logger.getLogger(RdfGatheringAgent.class
                        .getName()).log(Level.INFO, "No local copy of Acts & Regs found, cloning from GitHub.");
                Git.cloneRepository()
                        .setURI(JUSTICE_LAWS_GIT)
                        .setDirectory(gitDir)
                        .call();
            }
        } catch (GitAPIException gitAPIException) {
            Logger.getLogger(RdfGatheringAgent.class
                    .getName()).log(Level.WARNING, "Failed to retrieve consolidated acts and regs from GitHub. Slow HTTP retrieval will be used instead.", gitAPIException);
        }
    }

    public void fetchAndParseActsAndConsolidatedRegs(Model model, Set<String> knownStatutoryInstruments, Map<String, Map<String, String>> searchIndex, File gitDir) throws JDOMException, IOException {
        SAXBuilder builder = new SAXBuilder();
        Document doc = builder.build(LEGIS_URL);
        Element actsRegList = doc.getRootElement();
        Element acts = actsRegList.getChild("Acts");
        Element regulations = actsRegList.getChild("Regulations");
        List<Element> actList = acts.getChildren("Act");
        List<Element> regList = regulations.getChildren("Regulation");
        Logger.getLogger(RdfGatheringAgent.class
                .getName()).log(Level.INFO, "Acts: {0}", actList.size());
        Logger.getLogger(RdfGatheringAgent.class
                .getName()).log(Level.INFO, "Regulations: {0}", regList.size());
        int englishActCount = 0;
        int englishRegCount = 0;
        int frenchActCount = 0;
        int frenchRegCount = 0;
        Map<String, String> regIdToUniqueId = new HashMap<>();
        Map<String, Map<String, String>> actIdToAttributes = new HashMap<>();
        Map<String, Map<String, String>> regIdToAttributes = new HashMap<>();
        List<String> statutoryInstrumentIds = new ArrayList<>();
        //Map the XML reference ids to the actual unique ID for each.
        for (Element regElement : regList) {
            final String language = regElement.getChildText("Language").substring(0, 2);
            if (language.equals("en")) {
                final String uniqueId = regElement.getChildTextTrim("UniqueId");
                if (!regIdToAttributes.containsKey(uniqueId)) {
                    regIdToAttributes.put(uniqueId, new HashMap<>());
                }
                Map<String, String> attributes = regIdToAttributes.get(uniqueId);
                englishRegCount++;
                final String url = regElement.getChildTextTrim("LinkToHTMLToC").replace("index.html", "FullText.html");
                regIdToUniqueId.put(regElement.getAttributeValue("id"), uniqueId);
                regIdToUniqueId.put(regElement.getAttributeValue("olid"), uniqueId);
                attributes.put("instrumentURI", STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(uniqueId));
                attributes.put("currentToDate", regElement.getChildTextTrim("CurrentToDate"));
                // The following two properties are language dependent -- we should do the same for French
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), urlProperty,
                        url, language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), rdfTypeProperty,
                        ResourceFactory.createResource(REG_CLASS_URI));
                attributes.put(TYPE_FIELD, REG_TYPE_VALUE);

                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), legislationIdentifierProperty,
                        uniqueId, language);
                statutoryInstrumentIds.add(uniqueId);
                knownStatutoryInstruments.add(uniqueId);
            } else if (language.equals("fr")) {
                frenchRegCount++;
                final String url = regElement.getChildTextTrim("LinkToHTMLToC").replace("index.html", "TexteComplet.html");
                final String uniqueId = regIdToUniqueId.get(regElement.getAttributeValue("id"));
                if (!regIdToAttributes.containsKey(uniqueId)) {
                    regIdToAttributes.put(uniqueId, new HashMap<>());
                }
                Map<String, String> attributes = regIdToAttributes.get(uniqueId);
//                attributes.put("instrumentURI", STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(regElement.getChildTextTrim("UniqueId")));
//                attributes.put("currentToDate", regElement.getChildTextTrim("CurrentToDate"));
                // The following two properties are language dependent -- we should do the same for French
//                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), titleProperty,
//                        regElement.getChildTextTrim("Title"), language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), urlProperty,
                        url, language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), legislationIdentifierProperty,
                        regElement.getChildTextTrim("UniqueId"), language);
            }
        }
        for (Element actElement : actList) {
            final String language = actElement.getChildText("Language").substring(0, 2);
            final String uniqueId = actElement.getChildTextTrim("UniqueId");
            if (!actIdToAttributes.containsKey(uniqueId)) {
                actIdToAttributes.put(uniqueId, new HashMap<>());
            }

            Map<String, String> attributes = actIdToAttributes.get(uniqueId);
            if (language.equals("en")) {
                englishActCount++;
                final String url = actElement.getChildTextTrim("LinkToHTMLToC").replace("index.html", "FullText.html");
                attributes.put("instrumentURI", STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(actElement.getChildTextTrim("UniqueId")));
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), urlProperty,
                        url, language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), rdfTypeProperty,
                        ResourceFactory.createResource(ACT_CLASS_URI));
                attributes.put(TYPE_FIELD, ACT_TYPE_VALUE);
                attributes.put("currentToDate", actElement.getChildTextTrim("CurrentToDate"));
                if (actElement.getChild("RegsMadeUnderAct") != null) {
                    for (Element reg : actElement.getChild("RegsMadeUnderAct").getChildren("Reg")) {
                        String regUniqueId = regIdToUniqueId.get(reg.getAttributeValue("idRef"));
                        Map<String, String> regAttributes = regIdToAttributes.get(regUniqueId);
                        model.add(ResourceFactory.createResource(regAttributes.get("instrumentURI")), enablingActProperty,
                                ResourceFactory.createResource(attributes.get("instrumentURI")));
                        model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), rdfTypeProperty,
                                ResourceFactory.createResource(ACT_CLASS_URI));
                        regAttributes.put(TYPE_FIELD, REG_TYPE_VALUE);
                        model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), enablesRegProperty,
                                ResourceFactory.createResource(regAttributes.get("instrumentURI")));
                    }
                }
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), nameProperty,
                        actElement.getChildTextTrim("Title"), language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), urlProperty,
                        actElement.getChildTextTrim("LinkToHTMLToC").replace("index.html", "FullText.html"), language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), legislationIdentifierProperty,
                        uniqueId, language);
                statutoryInstrumentIds.add(uniqueId);
                knownStatutoryInstruments.add(uniqueId);
            } else if (language.equals("fr")) {
                frenchActCount++;
                final String url = actElement.getChildTextTrim("LinkToHTMLToC").replace("index.html", "TexteComplet.html");
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), urlProperty,
                        url, language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), nameProperty,
                        actElement.getChildTextTrim("Title"), language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), urlProperty,
                        actElement.getChildTextTrim("LinkToHTMLToC").replace("index.html", "TexteComplet.html"), language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), legislationIdentifierProperty,
                        actElement.getChildTextTrim("UniqueId"), language);
                statutoryInstrumentIds.add(uniqueId);
                knownStatutoryInstruments.add(uniqueId);
            }
        }
        for (String statutoryInstrumentId : statutoryInstrumentIds) {
            fetchAndParseConsolidatedStatutoryInstrument(model, toUrlSafeId(statutoryInstrumentId), knownStatutoryInstruments, searchIndex, gitDir);
        }
        Logger.getLogger(RdfGatheringAgent.class
                .getName()).log(Level.INFO, "English Acts: {0}", englishActCount);
        Logger.getLogger(RdfGatheringAgent.class
                .getName()).log(Level.INFO, "English Regulations: {0}", englishRegCount);
        Logger.getLogger(RdfGatheringAgent.class
                .getName()).log(Level.INFO, "French Acts: {0}", frenchActCount);
        Logger.getLogger(RdfGatheringAgent.class
                .getName()).log(Level.INFO, "French Regulations: {0}", frenchRegCount);
    }

    private String toUrlSafeId(String item) {
        item = item.trim()
                .replaceAll("/", "-")
                .replaceAll(" ", "_")
                //The next few lines address data quality issues in the published set.
                .replaceAll("_\u2013_", "-")
                .replaceAll("_\u2014_", "-")
                .replaceAll("S.C.2020", "S.C._2020")
                .replaceAll("S._C._", "S.C._")
                .replaceAll("R.S.C.,", "R.S.C.");
        if (item.startsWith("S.C._")) {
            item = item.replaceAll(",_c.", ",c.");
        }
        if (item.startsWith("S.C.")) {
            item = item.replaceAll("S.C", "SC");
            item = item.replaceAll("[\\.,_]+", "-");
        }
        return item;
    }

    private CharSequence collectTextFrom(Element el) {
        StringBuilder returnable = new StringBuilder();
        for (Content con : el.getDescendants()) {
            if (con.getCType() == Content.CType.Text || con.getCType() == Content.CType.CDATA) {
                String value = con.getValue().trim();
                if (!value.isEmpty()) {
                    if (returnable.length() != 0) {
                        returnable.append(' ');
                    }
                    returnable.append(value);
                }
            }
        }
        return returnable;
    }

    private int countWordsIn(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }

        String[] words = text.split("\\W+");
        return words.length;
    }

    private void indexConsolidatedInstrument(Document doc, Model model, Resource instrumentURI, String instrumentId, Map<String, Map<String, String>> searchIndex, String lang, String url) {
        Namespace limsNamespace = null;
        for (Namespace ns : doc.getRootElement().getAdditionalNamespaces()) {
            if (ns.getURI().equals("http://justice.gc.ca/lims")) {
                limsNamespace = ns;
            }
        }
        String type = null;
        Statement typeStatement = model.getProperty(instrumentURI, rdfTypeProperty);
        if (typeStatement != null) {
            if (typeStatement.getResource().getURI().equals(ACT_CLASS_URI)) {
                type = ACT_TYPE_VALUE;
            } else if (typeStatement.getResource().getURI().equals(REG_CLASS_URI)) {
                type = REG_TYPE_VALUE;
            }
        }
        final String textFieldName = lang.equals("fr") ? TEXT_FIELD_FRENCH : TEXT_FIELD_ENGLISH;
        final String titleFieldName = lang.equals("fr") ? TITLE_FIELD_FRENCH : TITLE_FIELD_ENGLISH;
        final String linkFieldName = lang.equals("fr") ? LINK_FIELD_FRENCH : LINK_FIELD_ENGLISH;
        String text = collectTextFrom(doc.getRootElement()).toString();
        int wordCount = countWordsIn(text);
        model.add(instrumentURI, wordCountProperty, String.valueOf(wordCount), lang);
        String title = instrumentId;
        Element identification = doc.getRootElement().getChild("Identification");
        if (identification != null) {
            title = identification.getChildTextNormalize("ShortTitle");
            if (title == null) {
                title = identification.getChildTextNormalize("LongTitle");
            }
            if (title == null) {
                title = identification.getChildTextNormalize("InstrumentNumber");
            }
            // Pick amending reference from the proper spot in the XML tree.
            Element chapter = identification.getChild("Chapter");
            if (chapter != null) {
                Element annualStatuteId = chapter.getChild("AnnualStatuteId");
                if (annualStatuteId != null) {
                    String statuteNumber = annualStatuteId.getChildTextTrim("AnnualStatuteNumber");
                    // There's nonsense in these that is not numbers. We're only going down to the chapter level.
                    statuteNumber = statuteNumber.split("[^0-9]+")[0];
                    String statuteYear = annualStatuteId.getChildTextTrim("YYYY");
                    final Resource amendingReg = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId("S.C._" + statuteYear + ",c._" + statuteNumber));
                    model.add(instrumentURI, consolidatesProperty, amendingReg);
                }
            }

            // If there isn't already a name property in the model for this instrument, use the one we have here. 
            // This is to patch up the Consolidated Index of Statutory Instruments from the CG.
            Statement existingNameProperty = model.getProperty(instrumentURI, nameProperty, lang);
            if (existingNameProperty == null) {
                model.add(instrumentURI, nameProperty, title, lang);
            }

            if (title == null) {
                anomalies.report(instrumentURI.getURI(), "Has neither a ShortTitle nor a LongTitle attribute, nor even an InstrumentNumber.");
                title = instrumentId;
            }
            Map<String, String> index = searchIndex.getOrDefault(instrumentURI.getURI(), new HashMap<>());
            index.put(textFieldName, collectTextFrom(identification).toString());
            index.put(titleFieldName, title);
            if (url != null) {
                index.put(linkFieldName, url);
            }
            searchIndex.put(instrumentURI.getURI(), index);
        }
        if (doc.getRootElement().getChild("Body") != null) {
            for (Element section : doc.getRootElement().getChild("Body").getChildren("Section")) {
                addLimsSectionToIndex(limsNamespace, section, instrumentURI, searchIndex, textFieldName, titleFieldName, title, url, linkFieldName, type);
            }
        }
    }

    /**
     * Add the top orders-in-council to the given model and index. If the Acts
     * &amp; Regs are already in the model, they will be linked where the Act
     * name matches.
     *
     * @param model the model to which the triples should be added
     * @param searchIndex the search index to which the text should be added.
     * @param maxOrders the maximum number of orders in council to add
     */
    public void fetchAndParseOrdersInCouncil(Model model, Map<String, Map<String, String>> searchIndex, int maxOrders) {
        //First, we cache the names of known Acts.
        Map<String, Resource> actNames = new HashMap<>();
        ResIterator namedSubjects = model.listSubjectsWithProperty(nameProperty);
        while (namedSubjects.hasNext()) {
            Resource subject = namedSubjects.nextResource();
            if (subject.getURI().startsWith(STATUTORY_INSTRUMENT_PREFIX)) {
                Statement nameStatement = model.getProperty(subject, nameProperty, "en");
                if (nameStatement == null) {
                    nameStatement = model.getProperty(subject, nameProperty);
                }
                if (nameStatement != null) {
                    String name = nameStatement.getString();
                    actNames.put(name, subject);
                }
            }
        }
        WebDriver driver = new HtmlUnitDriver(false);
        driver.get(ORDER_IN_COUNCIL_URL_ENGLISH);
        System.out.println(driver.getTitle());
        driver.findElement(By.id("btnSearch")).submit();
        System.out.println(driver.getTitle());
        System.out.println(driver.getCurrentUrl());
        Integer maxPage = Integer.parseInt(driver.findElement(By.cssSelector("span.btn.btn-default.first")).getText());
        System.out.println("Pages of OICs: " + maxPage);
        maxPage = Math.min(maxOrders / 5, maxPage);
        for (int i = 1; i <= maxPage; i++) { // Yes, they're 1-indexed. :(
            driver.get("https://orders-in-council.canada.ca/results.php?lang=en&pageNum=" + i);
            System.out.println(driver.getCurrentUrl());
            org.jsoup.nodes.Document doc = Jsoup.parse(driver.getPageSource(), driver.getCurrentUrl());
            Elements tables = doc.select("table");
            for (org.jsoup.nodes.Element table : tables) {
                String id = table.selectFirst("tr > td:eq(1)").text();
                String date = table.selectFirst("tr > td:eq(2)").text();
                List<String> acts = new ArrayList<>();
                org.jsoup.nodes.Element actElement = table.selectFirst("tr > td:containsOwn(act) + td");
                if (actElement != null) {
                    for (TextNode node : actElement.textNodes()) {
                        acts.add(node.text().trim());
                    }
                }
                String precis = table.selectFirst("tr > td:containsOwn(precis) + td").text();
                String url = null;
                org.jsoup.nodes.Element attachmentLink = table.selectFirst("tr > td:containsOwn(attachments) + td > a");
                if (attachmentLink != null) {
                    try {
                        url = new URL(new URL(driver.getCurrentUrl()), attachmentLink.attr("href")).toExternalForm();
                    } catch (MalformedURLException ex) {
                        Logger.getLogger(RdfGatheringAgent.class.getName()).log(Level.WARNING, "Invalid attachment url spec \"{0}\" found on page {1}", new Object[]{attachmentLink.attr("href"), driver.getCurrentUrl()});
                    }
                }
                String instrumentURI = ORDER_IN_COUNCIL_PREFIX + id;
                String name = id;
                final org.jsoup.nodes.Element subjectElement = table.selectFirst("tr > td:containsOwn(subject) + td");
                if (subjectElement != null) {
                    name = id + " - " + subjectElement.text();
                }
                final Resource subject = ResourceFactory.createResource(instrumentURI);
                for (String act : acts) {
                    if (!act.isBlank()) {
                        Resource enablingSubject = actNames.get(act);
                        if (enablingSubject != null) {
                            model.add(subject, enablingActProperty, enablingSubject);
                        } else {
                            if (!act.equals(OTHER_THAN_STATUTORY_AUTHORITY) && !act.equals(NONE_STATUTORY_AUTHORITY)) {
                                Logger.getLogger(RdfGatheringAgent.class.getName()).log(Level.WARNING, "Unknown enabling act \"{0}\" found on page {1}", new Object[]{act, driver.getCurrentUrl()});
                            }
                        }
                    }
                }

                model.add(subject, legislationDateProperty, date, XSDDateType.XSDdate);
                model.add(subject, legislationIdentifierProperty, id);
                model.add(subject, rdfTypeProperty,
                        ResourceFactory.createResource(OIC_CLASS_URI));

                model.add(subject, nameProperty, name, "en");
                Map<String, String> index = searchIndex.getOrDefault(instrumentURI, new HashMap<>());
                index.put(TYPE_FIELD, OIC_TYPE_VALUE);
                index.put(TEXT_FIELD_ENGLISH, precis);
                index.put(TITLE_FIELD_ENGLISH, name);
                if (url != null) {
                    index.put(LINK_FIELD_ENGLISH, url);
                }
                searchIndex.put(instrumentURI, index);

                //ResIterator namedResources = model.listResourcesWithProperty(this.nameProperty);
            }
        }
        //A second pass to grab the additional French properties is necessary.
        driver.get(ORDER_IN_COUNCIL_URL_FRENCH);
        System.out.println(driver.getTitle());
        driver.findElement(By.id("btnSearch")).submit();
        System.out.println(driver.getTitle());
        System.out.println(driver.getCurrentUrl());
        maxPage = Integer.parseInt(driver.findElement(By.cssSelector("span.btn.btn-default.first")).getText());
        System.out.println("Pages de PCs: " + maxPage);
        maxPage = Math.min(maxOrders / 5, maxPage);
        for (int i = 1; i <= maxPage; i++) { // Yes, they're 1-indexed. :(
            driver.get("https://decrets.canada.ca/results.php?lang=fr&pageNum=" + i);
            System.out.println(driver.getCurrentUrl());
            org.jsoup.nodes.Document doc = Jsoup.parse(driver.getPageSource(), driver.getCurrentUrl());
            Elements tables = doc.select("table");
            for (org.jsoup.nodes.Element table : tables) {
                String id = table.selectFirst("tr > td:eq(1)").text();
                String precis = table.selectFirst("tr > td:containsOwn(précis) + td").text();
                String url = null;
                org.jsoup.nodes.Element attachmentLink = table.selectFirst("tr > td:containsOwn(pièces jointes) + td > a");
                if (attachmentLink != null) {
                    try {
                        url = new URL(new URL(driver.getCurrentUrl()), attachmentLink.attr("href")).toExternalForm();
                    } catch (MalformedURLException ex) {
                        Logger.getLogger(RdfGatheringAgent.class.getName()).log(Level.WARNING, "Invalid attachment url spec \"{0}\" found on page {1}", new Object[]{attachmentLink.attr("href"), driver.getCurrentUrl()});
                    }
                }
                String instrumentURI = ORDER_IN_COUNCIL_PREFIX + id;
                String name = id;
                final org.jsoup.nodes.Element subjectElement = table.selectFirst("tr > td:containsOwn(sujet) + td");
                if (subjectElement != null) {
                    name = id + " - " + subjectElement.text();
                }
                final Resource subject = ResourceFactory.createResource(instrumentURI);
                model.add(subject, nameProperty, name, "fr");
                Map<String, String> index = searchIndex.getOrDefault(instrumentURI, new HashMap<>());
                index.put(TEXT_FIELD_FRENCH, precis);
                index.put(TITLE_FIELD_FRENCH, name);
                if (url != null) {
                    index.put(LINK_FIELD_FRENCH, url);
                }
                searchIndex.put(instrumentURI, index);

                //ResIterator namedResources = model.listResourcesWithProperty(this.nameProperty);
            }
        }

    }

    /**
     * Add whatever is possible from the Canada Gazette Part II using a
     * screen-scraper, since 2011. It's anticipated that this method will break
     * and need to be rewritten when the modernization work they're doing
     * advances.
     *
     * @param model the model to which the triples should be added
     * @param searchIndex the search index to which the text should be added.
     * @return the set of URL-safe statutory instrument IDs discovered in the
     * CG.
     */
    Set<String> fetchAndParseCanadaGazettePartII(Model model, Map<String, Map<String, String>> searchIndex) {
        Set<String> statutoryInstrumentIds = new TreeSet<>();
        WebDriver driver = new HtmlUnitDriver(false);
        driver.get(CG_PART_II_ENGLISH_URL);
        System.out.println(driver.getTitle());
        Set<String> editions = new TreeSet<>();
        List<WebElement> lis = driver.findElements(By.tagName("li"));
        for (WebElement li : lis) {
            final String text = li.getText();
            if (text != null && text.contains("Canada Gazette, Part II: Volume")) {
                //HTML only available since 2012.
                if (Integer.parseInt(text.substring(0, text.indexOf(":"))) > 2011) {
                    try {
                        String href = new URL(new URL(driver.getCurrentUrl()), li.findElement(By.tagName("a")).getDomAttribute("href")).toExternalForm();
                        editions.add(href);
                    } catch (MalformedURLException ex) {
                        ex.printStackTrace();
                    }
                }
            }
        }
        TreeSet<String> publicationURLs = new TreeSet<>();
        for (String edition : editions) {
            driver.get(edition);
            System.out.println(driver.getTitle());
            System.out.println(driver.getCurrentUrl());
            List<WebElement> editionRows = driver.findElement(By.tagName("table")).findElements(By.tagName("tr"));
            for (WebElement tr : editionRows) {
                List<WebElement> indexLinks = tr.findElements(By.tagName("a"));
                for (WebElement indexLink : indexLinks) {
                    final String link = indexLink.getAttribute("href");
                    if (link != null && link.endsWith(".html")) {
                        try {
                            String href = new URL(new URL(driver.getCurrentUrl()), link).toExternalForm();
                            publicationURLs.add(href);
                        } catch (MalformedURLException ex) {
                            ex.printStackTrace();
                        }
                    }
                }
            }
        }
        for (String publicationURL : publicationURLs) {
            // First we fetch the English...
            driver.get(publicationURL);
            System.out.println(driver.getTitle());
            System.out.println(driver.getCurrentUrl());
            List<WebElement> instrumentParasEn = driver.findElement(By.tagName("main")).findElements(By.tagName("li"));
            for (WebElement tr : instrumentParasEn) {
                String[] lines = tr.getText().split("\\r?\\n");
                for (String line : lines) {
                    line = line.trim();
                    if (line.startsWith("SI/") || line.startsWith("SOR/")) {
                        WebElement aTag = tr.findElement(By.tagName("a"));
                        final String link = aTag.getAttribute("href");
                        if (link != null && link.endsWith(".html")) {
                            try {
                                String href = new URL(new URL(driver.getCurrentUrl()), link).toExternalForm();
                                String title = aTag.getText().trim().replace('\n', ' ');
                                final Resource instrumentURI = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(line));
                                model.add(instrumentURI, nameProperty, title, "en");
                                model.add(instrumentURI, urlProperty, href, "en");
                                model.add(instrumentURI, legislationIdentifierProperty, line, "en");
                                model.add(instrumentURI, rdfTypeProperty,
                                        ResourceFactory.createResource(REG_CLASS_URI));
                                Map<String, String> index = searchIndex.getOrDefault(instrumentURI.getURI(), new HashMap<>());
                                // The title is the only descriptive text we can get without retrieving every single instrument.
                                index.put(TEXT_FIELD_ENGLISH, title);
                                index.put(TITLE_FIELD_ENGLISH, title);
                                index.put(LINK_FIELD_ENGLISH, href);
                                searchIndex.put(instrumentURI.getURI(), index);
                                statutoryInstrumentIds.add(toUrlSafeId(line));
                            } catch (MalformedURLException ex) {
                                anomalies.report(driver.getCurrentUrl(), "Cannot resolve " + link + " against this base URL.");
                                ex.printStackTrace();
                            }
                        }
                    }
                }
            }
            // And then we fetch the corresponding French.
            driver.get(publicationURL.replace("index-eng.html", "index-fra.html"));
            System.out.println(driver.getTitle());
            System.out.println(driver.getCurrentUrl());
            List<WebElement> instrumentParasFr = driver.findElement(By.tagName("main")).findElements(By.tagName("li"));
            for (WebElement tr : instrumentParasFr) {
                String[] lines = tr.getText().split("\\r?\\n");
                for (String line : lines) {
                    line = line.trim();
                    if (line.startsWith("TR/") || line.startsWith("DORS/")) {
                        WebElement aTag = tr.findElement(By.tagName("a"));
                        final String link = aTag.getAttribute("href");
                        if (link != null && link.endsWith(".html")) {
                            try {
                                String href = new URL(new URL(driver.getCurrentUrl()), link).toExternalForm();
                                String title = aTag.getText().trim().replace('\n', ' ');
                                final Resource instrumentURI = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(line.replace("TR/", "SI/").replace("DORS/", "SOR/")));
                                model.add(instrumentURI, nameProperty, title, "fr");
                                model.add(instrumentURI, urlProperty, href, "fr");
                                model.add(instrumentURI, legislationIdentifierProperty, line, "fr");
                                Map<String, String> index = searchIndex.getOrDefault(instrumentURI.getURI(), new HashMap<>());
                                // As in English, the title is the only descriptive text we can get.
                                index.put(TEXT_FIELD_FRENCH, title);
                                index.put(TITLE_FIELD_FRENCH, title);
                                index.put(LINK_FIELD_FRENCH, href);
                                searchIndex.put(instrumentURI.getURI(), index);
                            } catch (MalformedURLException ex) {
                                ex.printStackTrace();
                            }
                        }
                    }
                }
            }
        }
        return statutoryInstrumentIds;
    }

    private static class RdfParsingErrorHandler implements ErrorHandler {

        private final MutableBoolean pass;
        private final Path path;

        public RdfParsingErrorHandler(MutableBoolean pass, Path path) {
            this.pass = pass;
            this.path = path;
        }

        @Override
        public void warning(String message, long line, long col) {
            logParseEvent("WARN", line, col, message);
        }

        @Override
        public void error(String message, long line, long col) {
            logParseEvent("ERROR", line, col, message);
            pass.setFalse();
        }

        @Override
        public void fatal(String message, long line, long col) {
            logParseEvent("FATAL", line, col, message);
            pass.setFalse();
        }

        private void logParseEvent(String level, long line, long col, String message) {
            System.err.println(level + ": " + path + " " + line + ":" + col + " - " + message);
        }
    }

    /**
     * @return the anomalies
     */
    public IAnomalyReporter getAnomalies() {
        return anomalies;
    }

}
