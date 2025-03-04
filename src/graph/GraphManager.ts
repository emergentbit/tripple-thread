import { DatabaseManager } from '../db/DatabaseManager';
import {
    Triple,
    validateTriple
} from '../types/Triple';

export class GraphManager {
  constructor(private db: DatabaseManager) {}

  async init(): Promise<void> {
    await this.db.init();
    await this.db.setupSchema();
  }

  async addTriple(triple: Triple, graph: string = 'default'): Promise<void> {
    validateTriple(triple);
    await this.db.addTriple(triple, graph);
  }

  async addTriples(triples: Triple[], graph: string = 'default'): Promise<void> {
    triples.forEach(validateTriple);
    await this.db.addTriples(triples, graph);
  }

  async query(graph: string = 'default'): Promise<Triple[]> {
    return this.db.getTriples(graph);
  }

  async queryGraphs(): Promise<string[]> {
    const triples = await this.db.getTriples();
    const graphs = new Set<string>();
    triples.forEach(triple => {
      if (triple.graph) {
        graphs.add(triple.graph);
      }
    });
    return Array.from(graphs);
  }

  async deleteGraph(graph: string): Promise<void> {
    await this.db.deleteGraph(graph);
  }

  async clearAll(): Promise<void> {
    await this.db.clearAll();
  }

  private cleanUri(uri: string): string {
    // Remove leading/trailing whitespace
    let cleaned = uri.trim();

    // Remove angle brackets if present
    if (cleaned.startsWith('<') && cleaned.endsWith('>')) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    // Add http:// scheme if no scheme is present
    if (!cleaned.includes('://')) {
      cleaned = `http://${cleaned}`;
    }

    return cleaned;
  }

  async importFromTurtle(turtle: string, graph: string = 'default'): Promise<void> {
    const triples: Triple[] = [];
    const lines = turtle.split('\n');
    const prefixes: { [key: string]: string } = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.startsWith('@prefix')) {
        const [, prefix, uri] = trimmed.match(/@prefix\s+(\w+):\s+<([^>]+)>/) || [];
        if (prefix && uri) {
          prefixes[prefix] = uri;
        }
      } else {
        // Handle literals with datatypes by first finding the subject and predicate
        const subjectMatch = trimmed.match(/^<[^>]+>/);
        const predicateMatch = trimmed.match(/\s+<[^>]+>/);

        if (subjectMatch && predicateMatch) {
          const subject = this.expandUri(subjectMatch[0], prefixes);
          const predicate = this.expandUri(predicateMatch[0].trim(), prefixes);

          // Get the object part (everything after the predicate)
          const objectStart = subjectMatch[0].length + predicateMatch[0].length;
          const objectPart = trimmed.slice(objectStart).trim();

          // If it starts with a quote, keep it as is, otherwise expand it as a URI
          const object = objectPart.startsWith('"') ?
            objectPart.replace(/\s+\.$/, '') : // Remove trailing dot
            this.expandUri(objectPart.replace(/\s+\.$/, ''), prefixes); // Remove trailing dot

          triples.push({ subject, predicate, object });
        }
      }
    }

    await this.addTriples(triples, graph);
  }

  private expandUri(term: string, prefixes: { [key: string]: string }): string {
    // Handle literals with datatypes
    if (term.startsWith('"')) {
      // Keep the entire literal including datatype and language tag
      return term;
    }

    // Handle URIs
    if (term.startsWith('<')) {
      return term.slice(1, -1);
    }

    // Handle prefixed URIs
    const [prefix, local] = term.split(':');
    if (prefixes[prefix]) {
      return `${prefixes[prefix]}${local}`;
    }

    // Handle bare URIs
    return term;
  }

  async exportToTurtle(graph?: string): Promise<string> {
    const triples = await this.query(graph);

    // Group triples by subject
    const bySubject = new Map<string, Triple[]>();
    for (const triple of triples) {
      if (!bySubject.has(triple.subject)) {
        bySubject.set(triple.subject, []);
      }
      bySubject.get(triple.subject)!.push(triple);
    }

    // Generate Turtle output
    let turtle = '';

    // Add common prefixes
    turtle += '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n';
    turtle += '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n';
    turtle += '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n\n';

    // Add triples
    for (const [subject, subjectTriples] of bySubject) {
      turtle += `<${subject}>\n`;

      subjectTriples.forEach((triple, index) => {
        const isLast = index === subjectTriples.length - 1;

        turtle += `    <${triple.predicate}> ${
          triple.object.startsWith('"') ? triple.object : `<${triple.object}>`
        }${isLast ? ' .' : ' ;'}\n`;
      });

      turtle += '\n';
    }

    return turtle;
  }

  async backup(): Promise<void> {
    await this.db.backup();
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    await this.db.restoreFromBackup(backupPath);
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}