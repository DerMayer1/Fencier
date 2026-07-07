export type SecretPatternId =
  | "private_key"
  | "bearer_token"
  | "github_token"
  | "openai_api_key"
  | "aws_access_key_id"
  | "database_url"
  | "generic_api_key"
  | "generic_secret"
  | "generic_token";

export type SecretFinding = {
  patternId: SecretPatternId;
  lineNumber?: number;
  preview: string;
};

type SecretPattern = {
  id: SecretPatternId;
  regex: RegExp;
};

const secretPatterns: SecretPattern[] = [
  {
    id: "private_key",
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    id: "bearer_token",
    regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/i,
  },
  {
    id: "github_token",
    regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  },
  {
    id: "openai_api_key",
    regex: /\bsk-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    id: "aws_access_key_id",
    regex: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: "database_url",
    regex: /\b[a-z]+:\/\/[^:\s]+:[^@\s]+@[^/\s]+\/[^\s]+/i,
  },
  {
    id: "generic_api_key",
    regex: /\b[A-Z0-9_]*API[_-]?KEY\s*=\s*['"]?[^'"\s]{8,}/i,
  },
  {
    id: "generic_secret",
    regex: /\b[A-Z0-9_]*SECRET\s*=\s*['"]?[^'"\s]{8,}/i,
  },
  {
    id: "generic_token",
    regex: /\b[A-Z0-9_]*TOKEN\s*=\s*['"]?[^'"\s]{8,}/i,
  },
];

export function scanLineForSecret(content: string, lineNumber?: number): SecretFinding | undefined {
  for (const pattern of secretPatterns) {
    const match = pattern.regex.exec(content);

    if (match?.[0]) {
      return {
        patternId: pattern.id,
        lineNumber,
        preview: maskSecretPreview(match[0]),
      };
    }
  }

  return undefined;
}

function maskSecretPreview(value: string): string {
  if (value.includes("=") || value.toLowerCase().startsWith("bearer ")) {
    return maskSecretLine(value);
  }

  return maskValue(value);
}

export function maskSecretLine(content: string): string {
  const trimmed = content.trim();
  const assignmentMatch = /^(?<key>[^=\s]{2,})\s*=\s*['"]?(?<value>[^'"\s]+).*$/u.exec(trimmed);

  if (assignmentMatch?.groups?.key && assignmentMatch.groups.value) {
    return `${assignmentMatch.groups.key}=${maskValue(assignmentMatch.groups.value)}`;
  }

  const bearerMatch = /\bBearer\s+(?<value>[A-Za-z0-9._~+/=-]+)/iu.exec(trimmed);

  if (bearerMatch?.groups?.value) {
    return `Bearer ${maskValue(bearerMatch.groups.value)}`;
  }

  return maskValue(trimmed);
}

function maskValue(value: string): string {
  if (value.length <= 4) {
    return "...redacted";
  }

  return `${value.slice(0, 4)}...redacted`;
}
