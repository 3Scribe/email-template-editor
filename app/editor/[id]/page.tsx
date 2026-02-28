type EditorPageProps = {
  params: {
    id: string;
  };
};

export default function EditorPage({ params }: EditorPageProps) {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Editor</h1>
      <p>Editing template: {params.id}</p>
    </main>
  );
}
