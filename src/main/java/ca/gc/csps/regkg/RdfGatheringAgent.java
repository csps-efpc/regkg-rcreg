package ca.gc.csps.regkg;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
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
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
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
import org.apache.jena.rdf.model.AnonId;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.RDFVisitor;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.ResourceFactory;
import org.apache.jena.rdf.model.StmtIterator;
import org.apache.jena.rdf.model.impl.PropertyImpl;
import org.apache.jena.riot.RDFParser;
import org.apache.jena.riot.system.ErrorHandler;
import org.jdom2.Content;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.JDOMException;
import org.jdom2.input.SAXBuilder;
import org.jsoup.Jsoup;
import org.jsoup.select.Elements;

/**
 *
 * @author jturner
 */
public class RdfGatheringAgent {

    public static final String BASE_URL = "http://handshape.com/rdf/";
    private static final String STATUTORY_INSTRUMENT_PREFIX = "https://www.canada.ca/en/privy-council/ext/statutory-instrument/";
    private static final String ANNUAL_STATUTE_URL_PREFIX = "https://laws.justice.gc.ca/eng/AnnualStatutes/"; // Suffix with "year underscore chapter"
    private static final String LEGIS_URL = "https://laws-lois.justice.gc.ca/eng/XML/Legis.xml";
    private static final String CONSOLIDATED_INDEX_OF_STATUTORY_INSTRUMENTS_URL
            = "https://canadagazette.gc.ca/rp-pr/p2/2020/2020-12-31-c4/?-eng.html";
    private static final String TEXT_FIELD_ENGLISH = "text_en";
    private static final String TEXT_FIELD_FRENCH = "text_fr";
    private static final Charset UTF8 = StandardCharsets.UTF_8;
    private static final String REFERENCE_CHAPTER_MARKER = ", c. ";
    private static final String REFERENCE_SECTION_MARKER = ", s. ";
    private static final String REFERENCE_SECTIONS_MARKER = ", ss. ";

    // Declare the set of predicates that we'll be generating programmatically. The justice ones are all made-up.
    final PropertyImpl sponsorProperty = new PropertyImpl("https://www.gazette.gc.ca/ext/sponsor");
    final PropertyImpl consultationWordCountProperty = new PropertyImpl("https://www.gazette.gc.ca/ext/consultation-word-count");
    final PropertyImpl wordCountProperty = new PropertyImpl("https://schema.org/wordCount");
    final PropertyImpl sectionCountProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/section-count");
    final PropertyImpl cbaWordCountProperty = new PropertyImpl("https://www.gazette.gc.ca/ext/cba-word-count");
    final PropertyImpl riasWordCountProperty = new PropertyImpl("https://www.gazette.gc.ca/ext/rias-word-count");
    final PropertyImpl enablingActProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/enabling-act");
    final PropertyImpl amendsInstrumentProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/amends-instrument");
    final PropertyImpl consolidatesProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/consolidates");
    final PropertyImpl enablesRegProperty = new PropertyImpl("https://laws-lois.justice.gc.ca/ext/enables-regulation");
    final PropertyImpl titleProperty = new PropertyImpl("https://schema.org/name");
    final PropertyImpl urlProperty = new PropertyImpl("https://schema.org/url");
    final PropertyImpl orgnameProperty = new PropertyImpl("https://www.tpsgc-pwgsc.gc.ca/recgen/ext/org-name");
    final PropertyImpl departmentHeadProperty = new PropertyImpl("https://www.tpsgc-pwgsc.gc.ca/recgen/ext/department-head");
    final PropertyImpl metadataLabelProperty = new PropertyImpl("https://www.csps-efpc.gc.ca/ext/instrument-references");

    public void fetchAndParseLocalTurtle(Model model, MutableBoolean pass) throws IOException {
        // Iterate through the "rdf" directory for turtle files.
        // Manually-coded facts and shorthand prefixes can be declared in the turtle.
        File root = new File("rdf");

        Files.walk(root.toPath()).filter(path -> Files.exists(path, LinkOption.NOFOLLOW_LINKS)).filter(path -> path.toFile().isFile()).forEach(path -> {
            ErrorHandler handler = new RdfParsingErrorHandler(pass, path);
            switch (FilenameUtils.getExtension(path.toString())) {
                case "ttl":
                case "nt":
                    RDFParser.source(path).checking(true).errorHandler(handler).build().parse(model);
                    break;
                default:
                    System.err.println("ERROR: Unexpected file extension at " + path);
                    pass.setFalse();
                    break;
            }
        });
    }

    public void writeIndexToJson(Model model, Map<String, Map<String, String>> index, String path) throws IOException, NoSuchElementException {
        File targetFile = new File(path);
        if(targetFile.exists()) {
            Files.delete(targetFile.toPath());
        }
        Gson gson = new GsonBuilder().create();
        try(FileOutputStream fos = new FileOutputStream(targetFile)) {
            fos.write("[\n".getBytes(UTF8));
            Iterator<String> it = index.keySet().iterator();
            while(it.hasNext()) {
                String key = it.next();
                TreeMap<String, String> value = new TreeMap(index.get(key));
                value.put("id", key);
                fos.write(gson.toJson(value).getBytes(UTF8));
                if(it.hasNext()) {
                    fos.write(",".getBytes(UTF8));
                }
                fos.write("\n".getBytes(UTF8));
            }
            fos.write("]".getBytes(UTF8));
            fos.flush();
            fos.close();
        }
    }
    public void writeModelToSqlite(Model model, String path) throws IOException, NoSuchElementException {
        // Write the given model out to a nicely-packed SQLite db.
        // Setup DDL/SQL is in a test resource called "/ddl.sql"
        // Optimization is in a test resource called "finalize.sql"
        try {
            Connection conn = DriverManager.getConnection("jdbc:sqlite:" + path);
            try (Statement stmt = conn.createStatement()) {
                String ddlFile = IOUtils.toString(getClass().getResourceAsStream("/ddl.sql"), "UTF-8");
                String lines[] = ddlFile.split("\\r?\\n");
                for (String line : lines) {
                    stmt.execute(line);
                }
            }
            conn.setAutoCommit(false);
            try (PreparedStatement stmt = conn.prepareStatement("INSERT INTO TRIPLES (SUBJECT, OBJECT, PREDICATE) VALUES (?, ?, ?)")) {
                StmtIterator stmts = model.listStatements();
                while (stmts.hasNext()) {
                    //Namespace conflict for JDBC Statements and Jena Statements!
                    org.apache.jena.rdf.model.Statement triple = stmts.nextStatement();
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
                try (PreparedStatement stmt = conn.prepareStatement("INSERT INTO PREFIXES (PREFIX, URL) VALUES (?, ?)")) {
                    stmt.setString(1, entry.getKey());
                    stmt.setString(2, entry.getValue());
                    System.out.println(entry.getKey() + " -> " + entry.getValue());
                    stmt.execute();
                }
            }
            conn.commit();
            conn.setAutoCommit(true);
            try (Statement stmt = conn.createStatement()) {
                String ddlFile = IOUtils.toString(getClass().getResourceAsStream("/finalize.sql"), "UTF-8");
                String lines[] = ddlFile.split("\\r?\\n");
                for (String line : lines) {
                    stmt.execute(line);
                }
            }
            conn.close();
        } catch (SQLException ex) {
            Logger.getLogger(RdfGatheringAgent.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public void fetchAndParseDepartments(Model model, Map<String, Map<String, String>> searchIndex) throws JDOMException, IOException {
        FileReader in = new FileReader("csv" + File.separator + "departments.csv", StandardCharsets.UTF_8);
        Iterable<CSVRecord> records = CSVFormat.DEFAULT.withNullString("").withIgnoreSurroundingSpaces().withHeader().parse(in);
        for (CSVRecord record : records) {
            String resourceURI = "https://www.tpsgc-pwgsc.gc.ca/recgen/orgid/" + record.get("ORG_ID").trim();
            final Resource subject = ResourceFactory.createResource(resourceURI);
            StringBuilder textEn = new StringBuilder();
            StringBuilder textFr = new StringBuilder();
            Map<String, String> index = searchIndex.getOrDefault(resourceURI, new HashMap<String, String>());
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

    public void fetchAndParseMetadata(Model model) throws IOException {
        File file = new File("metadata.csv");
        if (file.exists()) {
            FileReader in = new FileReader(file, StandardCharsets.UTF_8);
            Iterable<CSVRecord> records = CSVFormat.DEFAULT.withHeader().parse(in);
            for (CSVRecord record : records) {
                final Resource subject = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(record.get("instrument_number")));
                if (record.get("category_item_desc_en") != null && !record.get("category_item_desc_en").isEmpty()) {
                    model.add(subject, metadataLabelProperty, record.get("category_item_desc_en"));
                }
            }
        }
    }

    public void fetchAndParseRias(Model model, Set<String> knownStatutoryInstruments) throws IOException {
        // Parse the regacan set from UQAM. Need to find a long-term home for this.
        File file = new File("regcan.csv");
        if (file.exists()) {
            FileReader in = new FileReader(file, StandardCharsets.UTF_8);
            Iterable<CSVRecord> records = CSVFormat.DEFAULT.withHeader().parse(in);
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
                    model.add(subject, titleProperty, regText.substring(startIndex, regText.indexOf(" P.C. ")).trim());
                }
                model.add(subject, sponsorProperty, record.get("sponsor"));
                model.add(subject, cbaWordCountProperty, record.get("CBA.wordcount"));
                model.add(subject, riasWordCountProperty, record.get("rias.wordcount"));
                model.add(subject, consultationWordCountProperty, record.get("consultation.wordcount"));
            }
        }
    }

    public void fetchAndParseStatutoryInstruments(Model model, Set<String> knownStatutoryInstrumentIds) throws JDOMException, IOException {
        try {
            Map<String, String> statutoryInstruments = new TreeMap<>();
            String[] sections = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,other-autre".split(",");
            for (String section : sections) {
                URL u = new URL(CONSOLIDATED_INDEX_OF_STATUTORY_INSTRUMENTS_URL.replace("?", section));
                Logger.getLogger(RdfGatheringAgent.class
                        .getName()).log(Level.INFO, "Fetching " + u.toExternalForm());
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
                    model.add(ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + entry.getKey()), this.titleProperty, String.valueOf(entry.getValue()));
                } else {
                    System.out.println("Unparsable instrument: [" + entry.getKey() + "] " + entry.getValue());
                }
            }
        } catch (NullPointerException e) {
            e.printStackTrace();
            throw new IOException(e);
        }
    }

    private void fetchAndParseConsolidatedStatutoryInstrument(Model model, String instrumentId, Set<String> statutoryInstrumentIds, Map<String, String> unknownStatutoryInstrumentIds, Map<String, Map<String, String>> searchIndex) throws JDOMException, IOException {
        final Resource amendedReg = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + instrumentId);

                    SAXBuilder builder = new SAXBuilder();
        final String xmlUrl = "https://laws-lois.justice.gc.ca/eng/XML/" + instrumentId + ".xml";
        System.out.println(xmlUrl);
        Document doc = builder.build(xmlUrl);
        String text = collectTextFrom(doc.getRootElement()).toString();
        TreeSet<String> amendingRegIds = new TreeSet<>();
        int wordCount = countWordsIn(text);
        int sectionCount = 0;
        // TODO Numebr of section
        if (doc.getRootElement().getChild("Body") != null) {
            for (Element section : doc.getRootElement().getChild("Body").getChildren("Section")) {
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
                                unknownStatutoryInstrumentIds.put(ref, item);
                            }
                        }
                    }
                }
            }
        }
        for (String amendingRegId : amendingRegIds) {
            final Resource amendingReg = ResourceFactory.createResource(STATUTORY_INSTRUMENT_PREFIX + amendingRegId);
            model.add(amendedReg, consolidatesProperty, amendingReg);
            model.add(amendingReg, amendsInstrumentProperty, amendedReg);
        }
        model.add(amendedReg, wordCountProperty, String.valueOf(wordCount));
        model.add(amendedReg, sectionCountProperty, String.valueOf(sectionCount));
        Map<String, String> index = searchIndex.getOrDefault(amendedReg.getURI(), new HashMap<String, String>());
        index.put(TEXT_FIELD_ENGLISH, text);
        searchIndex.put(amendedReg.getURI(), index);
    }

    public void fetchAndParseActsAndConsolidatedRegs(Model model, Set<String> knownStatutoryInstruments, Map<String, Map<String, String>> searchIndex) throws JDOMException, IOException {
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
        Map<String, String> regIdToUniqueId = new HashMap<>();
        Map<String, Map<String, String>> actIdToAttributes = new HashMap<>();
        Map<String, Map<String, String>> regIdToAttributes = new HashMap<>();
        List<String> statutoryInstrumentIds = new ArrayList<>();
        TreeMap<String, String> unknownStatutoryInstrumentIds = new TreeMap<>();
        //Map the XML reference ids to the actual unique ID for each.
        for (Element regElement : regList) {
            final String uniqueId = regElement.getChildTextTrim("UniqueId");
            final String language = regElement.getChildText("Language").substring(0, 2);
            if (!regIdToAttributes.containsKey(uniqueId)) {
                regIdToAttributes.put(uniqueId, new HashMap<>());
            }
            Map<String, String> attributes = regIdToAttributes.get(uniqueId);
            if (language.equals("en")) {
                englishRegCount++;
                regIdToUniqueId.put(regElement.getAttributeValue("id"), regElement.getChildText("UniqueId"));
                regIdToUniqueId.put(regElement.getAttributeValue("olid"), regElement.getChildText("UniqueId"));
                attributes.put("instrumentURI", STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(regElement.getChildTextTrim("UniqueId")));
                attributes.put("currentToDate", regElement.getChildTextTrim("CurrentToDate"));
                // The following two properties are language dependent -- we should do the same for French
//                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), titleProperty,
//                        regElement.getChildTextTrim("Title"), language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), urlProperty,
                        regElement.getChildTextTrim("LinkToHTMLToC"), language);
                statutoryInstrumentIds.add(uniqueId);
                knownStatutoryInstruments.add(uniqueId);
            }
        }

        for (Element actElement : actList) {
            final String uniqueId = actElement.getChildTextTrim("UniqueId");
            final String language = actElement.getChildText("Language").substring(0, 2);
            if (!actIdToAttributes.containsKey(uniqueId)) {
                actIdToAttributes.put(uniqueId, new HashMap<>());
            }
            Map<String, String> attributes = actIdToAttributes.get(uniqueId);
            if (language.equals("en")) {
                englishActCount++;
                attributes.put("instrumentURI", STATUTORY_INSTRUMENT_PREFIX + toUrlSafeId(actElement.getChildTextTrim("UniqueId")));
                attributes.put("currentToDate", actElement.getChildTextTrim("CurrentToDate"));
                if (actElement.getChild("RegsMadeUnderAct") != null) {
                    for (Element reg : actElement.getChild("RegsMadeUnderAct").getChildren("Reg")) {
                        String regUniqueId = regIdToUniqueId.get(reg.getAttributeValue("idRef"));
                        Map<String, String> regAttributes = regIdToAttributes.get(regUniqueId);
                        model.add(ResourceFactory.createResource(regAttributes.get("instrumentURI")), enablingActProperty,
                                ResourceFactory.createResource(attributes.get("instrumentURI")));
                        model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), enablesRegProperty,
                                ResourceFactory.createResource(regAttributes.get("instrumentURI")));
                    }
                }
                // The following two properties are language dependent -- we should do the same for French
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), titleProperty,
                        actElement.getChildTextTrim("Title"), language);
                model.add(ResourceFactory.createResource(attributes.get("instrumentURI")), urlProperty,
                        actElement.getChildTextTrim("LinkToHTMLToC").replace("/index.html", ""), language);
                statutoryInstrumentIds.add(uniqueId);
                knownStatutoryInstruments.add(uniqueId);
            }
        }
        for (String statutoryInstrumentId : statutoryInstrumentIds) {
            fetchAndParseConsolidatedStatutoryInstrument(model, toUrlSafeId(statutoryInstrumentId), knownStatutoryInstruments, unknownStatutoryInstrumentIds, searchIndex);
        }
        for (Map.Entry<String, String> entry : unknownStatutoryInstrumentIds.entrySet()) {
            System.out.println("Unknown Statutory Instrument ID: " + entry.getKey() + " from " + entry.getValue());
        }
        System.out.println("Number of Unknown Statutory Instruments references: " + unknownStatutoryInstrumentIds.size());
        Logger.getLogger(RdfGatheringAgent.class
                .getName()).log(Level.INFO, "English Acts: {0}", englishActCount);
        Logger.getLogger(RdfGatheringAgent.class
                .getName()).log(Level.INFO, "English Regulations: {0}", englishRegCount);
    }

    private String toUrlSafeId(String item) {
        return item.trim()
                .replaceAll("/", "-")
                .replaceAll(" ", "_")
                //The next few lines address data quality issues in the published set.
                .replaceAll("_\u2013_", "-")
                .replaceAll("_\u2014_", "-")
                .replaceAll("S.C.2020", "S.C._2020")
                .replaceAll("S._C._", "S.C._")
                .replaceAll("R.S.C.,", "R.S.C.");
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

    private class RdfParsingErrorHandler implements ErrorHandler {

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

}
