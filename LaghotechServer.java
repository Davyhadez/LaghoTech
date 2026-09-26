import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * =========================================================================
 * LAGHOTECH SERVER (Java 21 LTS)
 * Backend e Servidor Web Nativo para o Sistema Inteligente Laghotech
 * =========================================================================
 * 
 * Execução simples:
 *   java LaghotechServer.java
 * ou
 *   javac LaghotechServer.java && java LaghotechServer
 */
public class LaghotechServer {

    private static final int PORT = 8080;
    private static final String STATIC_DIR = ".";

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Handler de arquivos estáticos (HTML, CSS, JS, etc.)
        server.createContext("/", new StaticFileHandler());

        // Handlers de API REST
        server.createContext("/api/status", new ApiStatusHandler());
        server.createContext("/api/health", (exchange) -> {
            byte[] response = "{\"status\":\"ONLINE\",\"system\":\"Laghotech IoT Gateway v2.4\"}".getBytes();
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response);
            }
        });

        server.setExecutor(null); // Cria um executor padrão
        server.start();

        printBanner();
    }

    private static void printBanner() {
        System.out.println("==================================================================");
        System.out.println("   💎 LAGHOTECH - SMART ENERGY & SURVEILLANCE IOT GATEWAY");
        System.out.println("==================================================================");
        System.out.println(" [✔] Servidor Java 21 iniciado com sucesso!");
        System.out.println(" [✔] Porta de escuta: " + PORT);
        System.out.println(" [✔] Acesse no seu navegador:");
        System.out.println("       --> http://localhost:" + PORT + " <--");
        System.out.println("==================================================================");
        System.out.println(" Pressione Ctrl+C para encerrar o servidor.");
        System.out.println();
    }

    /**
     * Handler para servir index.html, style.css, app.js e assets
     */
    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String pathStr = exchange.getRequestURI().getPath();
            if (pathStr.equals("/") || pathStr.isEmpty()) {
                pathStr = "/index.html";
            }

            Path filePath = Paths.get(STATIC_DIR, pathStr.substring(1));

            if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
                String notFound = "404 - Arquivo não encontrado no Laghotech Server";
                exchange.sendResponseHeaders(404, notFound.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes());
                }
                return;
            }

            String contentType = getMimeType(filePath.getFileName().toString());
            byte[] fileBytes = Files.readAllBytes(filePath);

            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.getResponseHeaders().set("Cache-Control", "no-cache");
            exchange.sendResponseHeaders(200, fileBytes.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fileBytes);
            }

            logRequest(exchange.getRequestMethod(), pathStr, 200);
        }

        private String getMimeType(String filename) {
            if (filename.endsWith(".html")) return "text/html; charset=UTF-8";
            if (filename.endsWith(".css")) return "text/css; charset=UTF-8";
            if (filename.endsWith(".js")) return "application/javascript; charset=UTF-8";
            if (filename.endsWith(".json")) return "application/json; charset=UTF-8";
            if (filename.endsWith(".svg")) return "image/svg+xml";
            if (filename.endsWith(".png")) return "image/png";
            if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
            return "application/octet-stream";
        }
    }

    /**
     * Handler da API de status do sistema
     */
    static class ApiStatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            String jsonResponse = """
            {
              "system": "Laghotech Smart Energy",
              "version": "2.4.0",
              "server": "Java 21 LTS Standard Server",
              "timestamp": "%s",
              "gridVoltage": 220.4,
              "baseLoadKw": 0.14,
              "status": "OPERATIONAL"
            }
            """.formatted(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            byte[] responseBytes = jsonResponse.getBytes("UTF-8");
            exchange.sendResponseHeaders(200, responseBytes.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }

            logRequest("GET", "/api/status", 200);
        }
    }

    private static void logRequest(String method, String uri, int statusCode) {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        System.out.printf("[%s] %s %s -> HTTP %d%n", time, method, uri, statusCode);
    }
}
