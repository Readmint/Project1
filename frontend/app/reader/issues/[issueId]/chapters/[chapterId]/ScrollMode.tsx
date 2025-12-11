"use client";

export default function ScrollMode({ params }: { params: { issueId: string; chapterId: string } }) {
  const dummyText = `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec finibus 
    pretium sapien, vitae pharetra ipsum sagittis in. Fusce ultrices 
    sollicitudin venenatis. Aenean fringilla odio vitae dolor efficitur, 
    non facilisis sem fermentum. Pellentesque habitant morbi tristique 
    senectus et netus et malesuada fames ac turpis egestas.

    Sed nec semper felis. Integer et lorem sed magna ultricies bibendum. 
    Aliquam erat volutpat. Pellentesque vitae velit quis elit convallis 
    dapibus. Vestibulum ante ipsum primis in faucibus orci luctus et 
    ultrices posuere cubilia curae; Vivamus eget odio vel libero posuere 
    rhoncus dignissim non massa.

    Curabitur luctus at orci eget gravida. Nulla facilisi. Etiam blandit 
    interdum lacus, et feugiat lectus mollis non. Suspendisse at urna id 
    nulla vehicula pretium. Vivamus sit amet mi semper, sollicitudin arcu 
    non, aliquet nunc.

    ${"— More placeholder text — ".repeat(50)}
  `;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Scroll Mode — Chapter {params.chapterId}
      </h1>

      <p className="whitespace-pre-line leading-relaxed text-lg">
        {dummyText}
      </p>
    </div>
  );
}
