declare module 'html2pdf.js' {
  type Html2Pdf = {
    set(opts: Record<string, unknown>): Html2Pdf;
    from(el: HTMLElement): Html2Pdf;
    save(): Promise<void>;
  };
  const html2pdf: () => Html2Pdf;
  export default html2pdf;
}
