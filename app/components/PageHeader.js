export default function PageHeader({ currentPage, title, subtitle }) {
    return (
        <>
            <nav className="mt-2 flex gap-4">
                <a
                    href="/"
                    className={`text-black hover:underline ${currentPage === 'table' ? 'font-bold' : ''}`}
                >
                    🗒️ Table
                </a>
                <a
                    href="/graph"
                    className={`text-black hover:underline ${currentPage === 'graph' ? 'font-bold' : ''}`}
                >
                    🕸️ Graph
                </a>
            </nav>

            <header className="my-4">
                <div>
                    <h1 className="text-4xl font-bold">{title}</h1>
                    <h2 className="text-lg text-gray-600">{subtitle}</h2>
                </div>
            </header>
        </>
    );
} 