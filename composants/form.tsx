"use client"

import { useState } from 'react';
import { addOneDay } from '@/composants/lib';
import { CalculatorIcon, PlusCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'


interface TimeRow {
  day: string;
  startTime: string;
  endTime: string;
  isValid: boolean;
  errorMessage: string | null; // Message d'erreur spécifique à chaque ligne
  dateError: string | null; // Message d'erreur pour la date
}

export default function TimeForm() {
  const [rows, setRows] = useState<TimeRow[]>([{ day: '', startTime: '00:00', endTime: '00:00', isValid: true, errorMessage: null, dateError: null }]); // Initialiser sans lignes
  const [totalTime, setTotalTime] = useState<string | null>(null);
  const [globalErrorMessage, setGlobalErrorMessage] = useState<string | null>(null);
  const [includeWeekends, setIncludeWeekends] = useState<boolean>(false); // État pour inclure les week-ends



  const handleAddRow = () => {
    // Vérification de la date de la dernière ligne
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1); // Date de demain

    const newRow: TimeRow = {
      day: today.toISOString().split('T')[0], // Format YYYY-MM-DD
      startTime: '00:00',
      endTime: '00:00',
      isValid: true,
      errorMessage: null,
      dateError: null
    };

    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      const inputDate = new Date(lastRow.day);

      // Si la date de la dernière ligne est supérieure ou égale à demain, afficher un message d'erreur
      if (inputDate >= tomorrow) {
        alert("La date ne peut pas être supérieure ou égale à demain.");
        return; // Ne pas ajouter la ligne si la date est invalide
      }

      newRow.day = addOneDay(lastRow.day); // Définir la nouvelle date en ajoutant un jour
    }

    // Si les week-ends ne sont pas inclus et que le jour est un week-end, on met à jour la date
    if (!includeWeekends) {
      const newDate = new Date(newRow.day);
      if (newDate.getDay() === 6) { // Si c'est un samedi
        newDate.setDate(newDate.getDate() + 2); // Passer au lundi
      } else if (newDate.getDay() === 0) { // Si c'est un dimanche
        newDate.setDate(newDate.getDate() + 1); // Passer au lundi
      }
      newRow.day = newDate.toISOString().split('T')[0]; // Réinitialiser à la nouvelle date
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

    // Validation de la date
    if (field === 'day') {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1); // Date de demain

      const inputDate = new Date(value as string);

      if (inputDate >= tomorrow) {
        newRows[index].isValid = false;
        newRows[index].dateError = "La date ne peut pas être supérieure ou égale à demain.";
      } else {
        newRows[index].isValid = true;
        newRows[index].dateError = null;
      }
    }

    // Validation de l'heure de sortie par rapport à l'heure d'entrée
    if (field === 'endTime' || field === 'startTime') {
      const startTime = newRows[index].startTime;
      const endTime = newRows[index].endTime;

      // Ajout des minutes à 00 si elles ne sont pas spécifiées
      const startParts = startTime.split(':');
      const endParts = endTime.split(':');

      if (startParts[1] === '00') {
        startParts[1] = '00'; // Assurez-vous que les minutes sont 00
      }

      if (endParts[1] === '00') {
        endParts[1] = '00'; // Assurez-vous que les minutes sont 00
      }

      newRows[index].startTime = startParts.join(':');
      newRows[index].endTime = endParts.join(':');

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

    // Vérification si toutes les lignes sont valides avant de calculer
    const hasInvalidRows = rows.some(row => !row.isValid);

    if (hasInvalidRows) {
      setGlobalErrorMessage("Veuillez corriger les erreurs avant de soumettre le formulaire.");
      return; // Empêcher la soumission tant que les erreurs ne sont pas corrigées
    }

    setGlobalErrorMessage(null); // Réinitialiser le message d'erreur global

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
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <form onSubmit={calculateTotalTime}>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={includeWeekends}
            onChange={() => setIncludeWeekends(!includeWeekends)}
            className="mr-2"
          />
          <label className="px-6">Weekend</label>
        </div>

        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border-b">Date</th>
              <th className="border-b">Heure d&apos;entrée</th>
              <th className="border-b">Heure de sortie</th>
              <th className="border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={row.isValid ? '' : 'bg-red-100'}>
                <td>
                  <input
                    type="date"
                    value={row.day}
                    onChange={(e) => handleRowChange(index, 'day', e.target.value)}
                    className={`border ${row.dateError ? 'border-red-500' : 'border-gray-300'} rounded p-2`}
                  />
                  {row.dateError && <p className="text-red-500">{row.dateError}</p>}
                </td>
                <td>
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(e) => handleRowChange(index, 'startTime', e.target.value)}
                    className={`border ${row.errorMessage ? 'border-red-500' : 'border-gray-300'} rounded p-2`}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={(e) => handleRowChange(index, 'endTime', e.target.value)}
                    className={`border ${row.errorMessage ? 'border-red-500' : 'border-gray-300'} rounded p-2`}
                  />
                  {row.errorMessage && <p className="text-red-500">{row.errorMessage}</p>}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(index)}
                    className="text-bg-red-600  px-2 py-1 rounded-md hover:text-white"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          onClick={handleAddRow}
          className="text-green-600 px-4 py-2 rounded-md bg-green-500 hover:white"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />

        </button>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          <CalculatorIcon className="h-5 w-5 mr-2" aria-hidden="true" />
        </button>
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
  );
}
