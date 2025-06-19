import React, { useState, useCallback } from 'react';

// Main App component
const App = () => {
    // State to manage uploaded images and their generated metadata
    const [imagesData, setImagesData] = useState([]);
    // State for drag-and-drop active styles
    const [dragActive, setDragActive] = useState(false);
    // State for loading indicator during AI processing
    const [isLoading, setIsLoading] = useState(false);
    // State for a message box (e.g., for showing copy success)
    const [message, setMessage] = useState('');

    // Function to show a temporary message
    const showMessage = (msg, duration = 3000) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), duration);
    };

    // Handler for file input change
    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            await processFiles([...files]);
        }
    };

    // Handler for drag enter event
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    // Handler for drop event
    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles([...e.dataTransfer.files]);
            e.dataTransfer.clearData();
        }
    }, []);

    // Function to process each file (read, preview, call AI)
    const processFiles = async (files) => {
        setIsLoading(true);
        const newImagesData = [];
        for (const file of files) {
            if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
                showMessage(`Skipping ${file.name}: Only JPG, JPEG, and PNG images are supported.`);
                continue;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file); // Read as Data URL for preview and base64 for API
            await new Promise((resolve) => {
                reader.onloadend = async () => {
                    const imageUrl = reader.result;
                    const base64Image = imageUrl.split(',')[1]; // Get base64 part

                    // Call AI to generate metadata
                    const { title, keywords } = await generateMetadata(base64Image);

                    newImagesData.push({
                        filename: file.name,
                        previewUrl: imageUrl,
                        title: title || 'N/A',
                        keywords: keywords || 'N/A',
                        existingMetadata: 'Simulasi: Tidak ada metadata yang ditemukan untuk contoh ini.' // Placeholder as client-side EXIF/IPTC/XMP is complex
                    });
                    resolve();
                };
            });
        }
        setImagesData((prevData) => [...prevData, ...newImagesData]);
        setIsLoading(false);
    };

    // Function to call Gemini API for metadata generation
    const generateMetadata = async (base64Image) => {
        try {
            // Define the prompt for the Gemini API
            const prompt = `Analyze the content of this image. Generate a concise, catchy title suitable for Adobe Stock (max 15 words) and 5-20 highly relevant, SEO-optimized keywords. The keywords should be comma-separated. Provide the output in JSON format with 'title' and 'keywords' fields.`;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg", // Assuming jpeg or png will be sent
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "title": { "type": "STRING" },
                            "keywords": { "type": "STRING" }
                        },
                        "propertyOrdering": ["title", "keywords"]
                    }
                }
            };

            // IMPORTANT: For local development, you need to provide your actual Gemini API key here.
            // Replace "YOUR_GEMINI_API_KEY" with your actual key.
            // You can get one from Google AI Studio: https://aistudio.google.com/
            const apiKey = "AIzaSyBIMZTPlGq6FDLqzigzyddStipGrUvLJEY";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const jsonString = result.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(jsonString);
                return {
                    title: parsedJson.title,
                    keywords: parsedJson.keywords
                };
            } else {
                console.error("Struktur respons Gemini API tidak terduga:", result);
                return { title: 'Gagal membuat judul', keywords: 'Gagal membuat kata kunci' };
            }
        } catch (error) {
            console.error("Kesalahan saat memanggil Gemini API:", error);
            showMessage("Kesalahan saat membuat metadata. Silakan coba lagi.");
            return { title: 'Error', keywords: 'Error' };
        }
    };

    // Function to copy text to clipboard
    const copyToClipboard = (text, type) => {
        document.execCommand('copy'); // Fallback for navigator.clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => showMessage(`${type} disalin ke papan klip!`))
                .catch(err => {
                    console.error('Gagal menyalin teks: ', err);
                    showMessage(`Gagal menyalin ${type}.`);
                });
        } else {
             // Fallback for environments where navigator.clipboard is not available (e.g., iframes)
             const textarea = document.createElement('textarea');
             textarea.value = text;
             textarea.style.position = 'fixed'; // Avoid scrolling to bottom
             textarea.style.opacity = '0'; // Hide the textarea
             document.body.appendChild(textarea);
             textarea.focus();
             textarea.select();
             try {
                 document.execCommand('copy');
                 showMessage(`${type} disalin ke papan klip!`);
             } catch (err) {
                 console.error('Fallback: Gagal menyalin teks: ', err);
                 showMessage(`Gagal menyalin ${type}. Silakan salin secara manual.`);
             } finally {
                 document.body.removeChild(textarea);
             }
        }
    };

    // Function to export results to CSV
    const exportToCSV = () => {
        if (imagesData.length === 0) {
            showMessage("Tidak ada data untuk diekspor.");
            return;
        }

        let csvContent = "filename,title,keywords\n"; // CSV Header
        imagesData.forEach(item => {
            // Sanitize title and keywords for CSV by enclosing in double quotes and escaping existing quotes
            const sanitizedTitle = `"${item.title.replace(/"/g, '""')}"`;
            const sanitizedKeywords = `"${item.keywords.replace(/"/g, '""')}"`;
            csvContent += `${item.filename},${sanitizedTitle},${sanitizedKeywords}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // Feature detection for download attribute
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'adobe_stock_metadata.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showMessage("Data diekspor ke CSV!");
        } else {
            // Fallback for browsers that don't support download attribute (less common now)
            window.open(encodeURI(csvContent));
            showMessage("Konten CSV dibuka di tab baru.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-4 font-inter text-gray-800 flex flex-col items-center">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; }
                `}
            </style>

            {/* Message Box */}
            {message && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300 animate-fade-in-down">
                    {message}
                </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold text-indigo-800 mb-6 text-center drop-shadow-md">
                Generator Metadata Gambar Adobe Stock
            </h1>
            <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
                Seret & lepas gambar Anda di sini untuk secara otomatis menghasilkan judul dan kata kunci yang dioptimalkan SEO untuk Adobe Stock.
            </p>

            {/* Drag and Drop Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 mb-8 w-full max-w-3xl text-center transition-all duration-300
                    ${dragActive ? 'border-indigo-500 bg-indigo-50 shadow-xl' : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'}`}
            >
                <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center p-4">
                    <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v8"></path>
                    </svg>
                    <p className="text-xl font-semibold text-gray-700">Seret & Lepas Gambar Anda Di Sini</p>
                    <p className="text-md text-gray-500">(atau klik untuk memilih file)</p>
                    <p className="text-sm text-gray-400 mt-2">Mendukung: JPG, JPEG, PNG</p>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center space-x-3 text-indigo-700 font-semibold mb-6">
                    <svg className="animate-spin h-6 w-6 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menganalisis gambar...</span>
                </div>
            )}

            {/* Export Button */}
            {imagesData.length > 0 && (
                <button
                    onClick={exportToCSV}
                    className="mb-8 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Ekspor Semua ke CSV
                </button>
            )}

            {/* Display Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                {imagesData.map((image, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg p-6 flex flex-col border border-gray-200">
                        <h2 className="text-xl font-bold text-indigo-700 mb-4 truncate" title={image.filename}>
                            {image.filename}
                        </h2>
                        <div className="flex-shrink-0 w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                            <img src={image.previewUrl} alt="Pratinjau Gambar" className="max-w-full max-h-full object-contain rounded-lg" />
                        </div>

                        <div className="mb-4">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Metadata yang Ada:</h3>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
                                {image.existingMetadata}
                            </p>
                        </div>

                        <div className="mb-4 flex-grow">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Judul Buatan AI:</h3>
                            <p className="text-md font-medium text-gray-800 bg-indigo-50 p-3 rounded-md border border-indigo-200">
                                {image.title}
                            </p>
                            <button
                                onClick={() => copyToClipboard(image.title, 'Judul')}
                                className="mt-2 px-4 py-2 bg-indigo-500 text-white text-sm rounded-md shadow-sm hover:bg-indigo-600 transition-colors duration-200 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                                </svg>
                                Salin Judul
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Kata Kunci Buatan AI:</h3>
                            <p className="text-sm text-gray-800 bg-purple-50 p-3 rounded-md border border-purple-200 break-words">
                                {image.keywords}
                            </p>
                            <button
                                onClick={() => copyToClipboard(image.keywords, 'Kata Kunci')}
                                className="mt-2 px-4 py-2 bg-purple-500 text-white text-sm rounded-md shadow-sm hover:bg-purple-600 transition-colors duration-200 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                                </svg>
                                Salin Kata Kunci
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {imagesData.length === 0 && !isLoading && (
                <div className="text-center text-gray-500 mt-12 text-lg">
                    <p>Unggah gambar untuk memulai!</p>
                </div>
            )}
        </div>
    );
};

export default App;
