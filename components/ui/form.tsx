"use client"
"use client"

import { useState, useEffect } from 'react';
import { addOneDay } from '@/lib/date';

interface TimeRow {
  day: string;
  startTime: string;
  endTime: string;
  isValid: boolean;
  errorMessage: string | null;
  dateError: string | null;
}

export default function TimeForm() {
  const [rows, setRows] = useState<TimeRow[]>([{ day: new Date().toISOString().split('T')[0], startTime: '00:00', endTime: '00:00', isValid: true, errorMessage: null, dateError: null }]);
  const [totalTime, setTotalTime] = useState<string | null>(null);
  const [globalErrorMessage, setGlobalErrorMessage] = useState<string | null>(null);
  const [includeWeekends, setIncludeWeekends] = useState<boolean>(false);

  // Ajout d'un event listener pour Ctrl + "+"
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '+') {
        e.preventDefault();
        handleAddRow(); // Ajouter une nouvelle ligne
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [rows]); // Ajouter une dépendance pour la liste des lignes

  const handleAddRow = () => {
    const newRow: TimeRow = {
      day: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
      startTime: '00:00',
      endTime: '00:00',
      isValid: true,
      errorMessage: null,
      dateError: null
    };

    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      newRow.day = addOneDay(lastRow.day);
    }

    if (!includeWeekends) {
      const newDate = new Date(newRow.day);
      if (newDate.getDay() === 6) { // Samedi
        newDate.setDate(newDate.getDate() + 2); // Passer au lundi
      } else if (newDate.getDay() === 0) { // Dimanche
        newDate.setDate(newDate.getDate() + 1); // Passer au lundi
      }
      newRow.day = newDate.toISOString().split('T')[0];
    }

    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    const newRows = rows.filter((_, rowIndex) => rowIndex !== index);
    setRows(newRows);
  };

  const handleRowChange = <K extends keyof TimeRow>(index: number, field: K, value: TimeRow[K]) => {
    const newRows = [...rows];
    newRows[index][field] = value;

    if (field === 'day') {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      const inputDate = new Date(value as string);

      if (inputDate >= tomorrow) {
        newRows[index].isValid = false;
        newRows[index].dateError = "La date ne peut pas être supérieure ou égale à demain.";
      } else {
        newRows[index].isValid = true;
        newRows[index].dateError = null;
      }
    }

    if (field === 'endTime' || field === 'startTime') {
      const startTime = newRows[index].startTime;
      const endTime = newRows[index].endTime;

      if (startTime && endTime && endTime <= startTime) {
        newRows[index].isValid = false;
        newRows[index].errorMessage = `L'heure de sortie doit être supérieure à l'heure d'entrée pour la ligne ${index + 1}.`;
      } else {
        newRows[index].isValid = true;
        newRows[index].errorMessage = null;
      }
    }

    setRows(newRows);
  };

  const calculateTotalTime = (e: React.FormEvent) => {
    e.preventDefault();

    const hasInvalidRows = rows.some(row => !row.isValid);
    if (hasInvalidRows) {
      setGlobalErrorMessage("Veuillez corriger les erreurs avant de soumettre le formulaire.");
      return;
    }

    setGlobalErrorMessage(null);
    let totalMilliseconds = 0;

    rows.forEach(({ day, startTime, endTime, isValid }) => {
      if (day && startTime && endTime && isValid) {
        const startDate = new Date(`${day}T${startTime}`);
        const endDate = new Date(`${day}T${endTime}`);

        if (endDate > startDate) {
          totalMilliseconds += endDate.getTime() - startDate.getTime();
        }
      }
    });

    const totalHours = Math.floor(totalMilliseconds / 1000 / 60 / 60);
    const totalMinutes = Math.floor((totalMilliseconds / 1000 / 60) % 60);

    setTotalTime(`${totalHours} heures et ${totalMinutes} minutes`);
  };

  return (
    <div>
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <form onSubmit={calculateTotalTime}>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={includeWeekends}
              onChange={() => setIncludeWeekends(!includeWeekends)}
              className="mr-2"
            />
            <label>Weekend</label>
          </div>

          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left border border-gray-300">Date</th>
                <th className="px-4 py-2 text-center border border-gray-300">Heure d&apos;entrée</th>
                <th className="px-4 py-2 text-center border border-gray-300">Heure de sortie</th>
                <th className="px-4 py-2 text-center border border-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${row.isValid ? '' : 'bg-red-100'}`}>
                  <td className="px-4 py-2 border border-gray-300">
                    <input
                      type="date"
                      value={row.day}
                      onChange={(e) => handleRowChange(index, 'day', e.target.value)}
                      className={`border ${row.dateError ? 'border-red-500' : 'border-gray-300'} rounded p-2 w-full focus:ring focus:ring-indigo-200 transition`}
                    />
                    {row.dateError && <p className="text-red-500 text-sm mt-1">{row.dateError}</p>}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-center">
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => handleRowChange(index, 'startTime', e.target.value)}
                      className={`border ${row.errorMessage ? 'border-red-500' : 'border-gray-300'} rounded p-2 w-full focus:ring focus:ring-indigo-200 transition text-center`}
                    />
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-center">
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(e) => handleRowChange(index, 'endTime', e.target.value)}
                      className={`border ${row.errorMessage ? 'border-red-500' : 'border-gray-300'} rounded p-2 w-full focus:ring focus:ring-indigo-200 transition text-center`}
                    />
                    {row.errorMessage && <p className="text-red-500 text-sm mt-1">{row.errorMessage}</p>}
                  </td>
                  <td className="px-4 py-2 border border-gray-300">
                    <div className="flex items-center justify-center h-full">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="text-red-600 hover:text-red-400 transition inline-flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between mt-4">
            <button type="button" onClick={handleAddRow} className="bg-emerald-600 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition">
              Ajouter
            </button>
            <button type="submit" className="bg-indigo-600 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">
              Calculer
            </button>
          </div>
        </form>

        {totalTime && (
          <div className="mt-4 p-4 bg-gray-100 text-gray-700 rounded-md">
            Temps total : {totalTime}
          </div>
        )}

        {globalErrorMessage && (
          <div className="mt-2 p-4 bg-red-100 text-red-700 rounded-md">
            {globalErrorMessage}
          </div>
        )}
      </div>
      <p className="mt-4">Astuce : utilisez la touche <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"><b>Tab</b></span> pour changer de cellule rapidement.</p>
    </div>
  );
}
