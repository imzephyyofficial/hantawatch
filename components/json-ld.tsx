interface Props { data: object | object[]; }

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // structured data is intentionally inline; the @type fields are static literal strings
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
