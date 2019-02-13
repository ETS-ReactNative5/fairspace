package io.fairspace.saturn.vfs.managed;

import io.fairspace.saturn.auth.UserInfo;
import io.fairspace.saturn.services.collections.Collection;
import io.fairspace.saturn.services.collections.CollectionsService;
import org.junit.Before;
import org.junit.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.function.Supplier;

import static io.fairspace.saturn.rdf.SparqlUtils.setWorkspaceURI;
import static org.apache.jena.query.DatasetFactory.createTxnMem;
import static org.apache.jena.rdfconnection.RDFConnectionFactory.connect;
import static org.junit.Assert.*;

public class ManagedFileSystemTest {
    private final byte[] content1 = new byte[]{1, 2, 3};
    private final byte[] content2 = new byte[]{1, 2, 3, 4};

    private ManagedFileSystem fs;

    @Before
    public void before()  {
        setWorkspaceURI("http://example.com/");
        var store = new MemoryBlobStore();
        var rdf = connect(createTxnMem());
        Supplier<UserInfo> userInfoSupplier = () -> new UserInfo("userId", null, null, null);
        var collections = new CollectionsService(rdf, userInfoSupplier);
        fs = new ManagedFileSystem(rdf, store, userInfoSupplier, collections);
        var collection = new Collection();
        collection.setLocation("coll");
        collection.setName("My Collection");
        collection.setType("LOCAL");
        collections.create(collection);
    }

    @Test
    public void start() throws IOException {
        assertEquals("coll", fs.stat("coll").getPath());
        assertTrue(fs.stat("coll").isDirectory());

        // Other cases are tested elsewhere
    }

    @Test
    public void list() throws IOException {
        assertEquals(1, fs.list("").size());
        assertEquals("coll", fs.list("").get(0).getPath());
        assertTrue(fs.list("").get(0).isDirectory());

        fs.mkdir("coll/aaa");
        fs.mkdir("coll/aaa/bbb");
        fs.mkdir("coll/aaa/bbb/ccc");
        fs.mkdir("coll/aaa/bbb/ccc/ddd");
        var children = fs.list("coll/aaa/bbb");
        assertEquals(1, children.size());
        assertEquals("coll/aaa/bbb/ccc", children.get(0).getPath());
        assertTrue(children.get(0).isDirectory());
    }

    @Test
    public void mkdir() throws IOException {
        fs.mkdir("coll/aaa/bbb/ccc");
        var stat = fs.stat("coll/aaa/bbb/ccc");
        assertEquals("coll/aaa/bbb/ccc", stat.getPath());
        assertTrue(stat.isDirectory());
    }

    @Test
    public void writeAndRead() throws IOException {
        fs.mkdir("coll/dir");

        fs.create("coll/dir/file", new ByteArrayInputStream(content1));
        assertEquals(content1.length, fs.stat("coll/dir/file").getSize());
        var os = new ByteArrayOutputStream();
        fs.read("coll/dir/file", os);
        assertArrayEquals(content1, os.toByteArray());

        fs.modify("coll/dir/file", new ByteArrayInputStream(content2));
        assertEquals(content2.length, fs.stat("coll/dir/file").getSize());
        os = new ByteArrayOutputStream();
        fs.read("coll/dir/file", os);
        if (!Arrays.equals(content2, os.toByteArray())) {
            assertArrayEquals(content2, os.toByteArray());
        }
    }


    @Test
    public void copyDir() throws IOException {
        fs.mkdir("coll/dir1");
        fs.mkdir("coll/dir1/subdir");
        fs.create("coll/dir1/subdir/file", new ByteArrayInputStream(content1));
        fs.copy("coll/dir1", "coll/dir2");
        assertTrue(fs.exists("coll/dir1"));
        assertTrue(fs.exists("coll/dir2"));
        assertTrue(fs.exists("coll/dir2/subdir"));
        assertTrue(fs.exists("coll/dir2/subdir/file"));
        var os = new ByteArrayOutputStream();
        fs.read("coll/dir2/subdir/file", os);
        assertArrayEquals(content1, os.toByteArray());
    }

    @Test
    public void copyFile() throws IOException {
        fs.mkdir("coll/dir1");
        fs.mkdir("coll/dir2");
        fs.create("coll/dir1/file", new ByteArrayInputStream(content1));
        fs.copy("coll/dir1/file", "coll/dir2/file");
        assertTrue(fs.exists("coll/dir1"));
        assertTrue(fs.exists("coll/dir2"));
        assertTrue(fs.exists("coll/dir1/file"));
        assertTrue(fs.exists("coll/dir2/file"));
        var os = new ByteArrayOutputStream();
        fs.read("coll/dir2/file", os);
        assertArrayEquals(content1, os.toByteArray());
    }

    @Test
    public void moveDir() throws IOException {
        fs.mkdir("coll/dir1");
        fs.mkdir("coll/dir1/subdir");
        fs.create("coll/dir1/subdir/file", new ByteArrayInputStream(content1));
        fs.move("coll/dir1", "coll/dir2");
        assertFalse(fs.exists("coll/dir1"));
        assertTrue(fs.exists("coll/dir2"));
        assertTrue(fs.exists("coll/dir2/subdir"));
        assertTrue(fs.exists("coll/dir2/subdir/file"));
        var os = new ByteArrayOutputStream();
        fs.read("coll/dir2/subdir/file", os);
        assertArrayEquals(content1, os.toByteArray());
    }

    @Test
    public void moveFile() throws IOException {
        fs.mkdir("coll/dir1");
        fs.create("coll/dir1/file1", new ByteArrayInputStream(content1));
        fs.mkdir("coll/dir2");
        fs.move("coll/dir1/file1", "coll/dir2/file2");
        assertFalse(fs.exists("coll/dir1/file1"));
        assertTrue(fs.exists("coll/dir2/file2"));
        var os = new ByteArrayOutputStream();
        fs.read("coll/dir2/file2", os);
        assertArrayEquals(content1, os.toByteArray());
    }


    @Test
    public void deleteDir() throws IOException {
        fs.mkdir("coll/dir");
        fs.mkdir("coll/dir/subdir");
        fs.create("coll/dir/file", new ByteArrayInputStream(content1));

        fs.delete("coll/dir");

        assertFalse(fs.exists("coll/dir"));
        assertFalse(fs.exists("coll/dir/subdir"));
        assertFalse(fs.exists("coll/dir/file"));
    }

    @Test
    public void deleteFile() throws IOException {
        fs.mkdir("coll/dir");
        fs.create("coll/dir/file", new ByteArrayInputStream(content1));

        fs.delete("coll/dir/file");

        assertFalse(fs.exists("coll/dir/file"));

        fs.create("coll/dir/file", new ByteArrayInputStream(content2));

        assertTrue(fs.exists("coll/dir/file"));
        assertEquals(content2.length, fs.stat("coll/dir/file").getSize());
    }

    @Test
    public void isCollection() {
        assertTrue(ManagedFileSystem.isCollection("coll"));
        assertFalse(ManagedFileSystem.isCollection(""));
        assertFalse(ManagedFileSystem.isCollection("coll/dir"));
        assertFalse(ManagedFileSystem.isCollection("coll/dir/subdir"));
    }
}