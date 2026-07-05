import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../lib/redux/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { showToast } from '../../lib/redux/slices/toastSlice';
import { FileText, Loader } from 'lucide-react';

export default function PDFExtractionTab() {
  const token = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfResultQuestions, setPdfResultQuestions] = useState<any[]>([]);
  const [pyqAnalysis, setPyqAnalysis] = useState<any | null>(null);
  const [pdfType, setPdfType] = useState<'extract' | 'pyq'>('extract');

  const handlePdfUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return;
    setPdfLoading(true);
    setPdfResultQuestions([]);
    setPyqAnalysis(null);

    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const endpoint = pdfType === 'extract' ? '/api/ai/analyze-pdf' : '/api/ai/analyze-pyq';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'PDF processing failed');

      if (pdfType === 'extract') {
        setPdfResultQuestions(data.data.questions || []);
        dispatch(showToast('PDF question extraction complete!', 'success'));
      } else {
        setPyqAnalysis(data.data || null);
        dispatch(showToast('PYQ weightage analysis complete!', 'success'));
      }
    } catch (err: any) {
      dispatch(showToast(err.message || 'Error processing PDF', 'error'));
    } finally {
      setPdfLoading(false);
    }
  };

  const savePdfExtracted = async () => {
    try {
      for (const q of pdfResultQuestions) {
        await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...q,
            subjectName: q.subject || 'General Studies',
            topicName: q.topic || 'PDF Extraction',
          }),
        });
      }
      dispatch(showToast('Extracted questions cataloged successfully!', 'success'));
      setPdfResultQuestions([]);
      queryClient.invalidateQueries({ queryKey: ['allQuestions'] });
    } catch (e) {
      dispatch(showToast('Failed saving PDF extracted questions', 'error'));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
          <FileText className="w-5 h-5" />
          PDF Ingestion (OCR / PYQ / Notes)
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Upload study sheets, questions banks, or past year papers. AI will ingest the PDF and extract syllabus metadata or raw questions.
        </p>

        <form onSubmit={handlePdfUpload} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Action Mode</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPdfType('extract')}
                className={`py-2 text-xs font-semibold rounded-lg border transition ${
                  pdfType === 'extract'
                    ? 'bg-blue-600/15 border-indigo-500/40 text-blue-600'
                    : 'bg-white shadow-sm border-slate-200 text-slate-500'
                }`}
              >
                Extract Raw Questions
              </button>
              <button
                type="button"
                onClick={() => setPdfType('pyq')}
                className={`py-2 text-xs font-semibold rounded-lg border transition ${
                  pdfType === 'pyq'
                    ? 'bg-blue-600/15 border-indigo-500/40 text-blue-600'
                    : 'bg-white shadow-sm border-slate-200 text-slate-500'
                }`}
              >
                PYQ Weightage Analysis
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Select PDF File</label>
            <input
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 bg-white border border-slate-200 shadow-sm focus:border-indigo-500/50 rounded-xl text-slate-800 text-xs outline-none cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={pdfLoading || !pdfFile}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            {pdfLoading ? <Loader className="w-5 h-5 animate-spin" /> : <span>Process PDF File</span>}
          </button>
        </form>
      </div>

      {pdfResultQuestions.length > 0 && (
        <div className="bg-white shadow-sm border border-blue-100 p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-blue-600">Extracted PDF Questions</h3>
            <button
              onClick={savePdfExtracted}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition"
            >
              Save Extracted to Catalog
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {pdfResultQuestions.map((q, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-800">
                  {idx + 1}. {q.questionText}
                </h4>
                <div className="flex gap-2 my-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-blue-600 font-bold">{q.subject}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-emerald-600 font-bold">{q.topic}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-[10px] rounded text-amber-600 font-bold">{q.difficulty}</span>
                </div>
                {q.options && q.options.length > 0 && (
                  <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {q.options.map((opt: string, oi: number) => (
                      <li
                        key={oi}
                        className={`p-2 rounded border ${
                          oi === Number(q.correctAnswer)
                            ? 'bg-emerald-50 border-emerald-500/30 text-emerald-600'
                            : 'bg-[#f8f9fa] border-slate-200'
                        }`}
                      >
                        Option {oi}: {opt}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-slate-500 leading-relaxed bg-indigo-950/20 p-2.5 rounded border border-indigo-500/10">
                  <strong>Explanation:</strong> {q.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pyqAnalysis && (
        <div className="bg-white shadow-sm border border-blue-100 p-6 rounded-2xl flex flex-col gap-5">
          <h3 className="text-lg font-bold text-blue-600 border-b border-slate-200 pb-2">
            PYQ Syllabus Weightage Analysis
          </h3>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Repeated Focus Topics</h4>
            <div className="flex flex-wrap gap-2">
              {pyqAnalysis.repeatedTopics?.map((topic: string, i: number) => (
                <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold rounded-lg">
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Chapter Weightage Distribution</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {pyqAnalysis.weightageAnalysis?.map((ch: any, i: number) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="block text-xs text-slate-500 truncate">{ch.chapter}</span>
                  <span className="block font-bold text-blue-600 mt-1">{ch.weightage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-2">Predicted Examination Questions</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-500">
              {pyqAnalysis.probableQuestions?.map((q: string, i: number) => (
                <li key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <strong>Q{i + 1}:</strong> {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
