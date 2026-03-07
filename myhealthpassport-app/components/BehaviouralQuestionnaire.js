import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  developmentalQuestions,
  developmentalQuestionsTeacher,
  updateStudentDevelopmentalQuestionnarie,
  updateTeacherDevelopmentalQuestionnarie,
} from '@/services/secureApis';
import { toastMessage } from '@/helpers/utilities';
import nookies from 'nookies';
import InlineSpinner from '@/components/UI/InlineSpinner';

export default function BehaviouralQuestionnaire({ tabName }) {
  const cookies = nookies.get();
  const router = useRouter();
  const { childId, id } = useParams();
  const [results, setResults] = useState({});
  const [notes, setNotes] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const recordId = childId ? childId : id;

  useEffect(() => {
    const apiFunction = cookies?.root === 'teacher' ? developmentalQuestionsTeacher : developmentalQuestions;
    apiFunction(recordId)
      .then(res => {
        const response = JSON.parse(res);
        // console.log('Developmental Questions Response: ', response);
        setResults(response);

        // Initialize form data with existing answers converted to display values
        if (response.status === true && response.data.questions) {
          const initialFormData = {};
          response.data.questions.forEach(question => {
            if (question.answer !== null) {
              // Convert backend answer to display value
              const displayValue = convertBackendToDisplay(question.answer, question.score_type);
              initialFormData[question.question_id] = displayValue;
            }
          });
          setFormData(initialFormData);
        }
      })
      .catch(err => {
        toastMessage(err, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Convert backend answer value to display value (what user sees)
  const convertBackendToDisplay = (backendValue, scoreType) => {
    if (scoreType === 'Positive') {
      // For positive: backend and display are the same
      // 1=Never, 2=Sometimes, 3=Always
      return backendValue;
    } else {
      // For negative: convert backend to user-friendly display
      // Backend: 1=Always, 2=Sometimes, 3=Never
      // Display: 1=Never, 2=Sometimes, 3=Always
      switch (backendValue) {
        case '1':
          return '3'; // Backend 1 (Always) -> Display 3 (Always)
        case '2':
          return '2'; // Backend 2 (Sometimes) -> Display 2 (Sometimes)
        case '3':
          return '1'; // Backend 3 (Never) -> Display 1 (Never)
        default:
          return backendValue;
      }
    }
  };

  // Convert display value to backend value (what API expects)
  const convertDisplayToBackend = (displayValue, scoreType) => {
    if (scoreType === 'Positive') {
      // For positive: display and backend are the same
      return displayValue;
    } else {
      // For negative: convert user selection to backend format
      // Display: 1=Never, 2=Sometimes, 3=Always
      // Backend: 1=Always, 2=Sometimes, 3=Never
      switch (displayValue) {
        case '1':
          return '3'; // Display 1 (Never) -> Backend 3 (Never)
        case '2':
          return '2'; // Display 2 (Sometimes) -> Backend 2 (Sometimes)
        case '3':
          return '1'; // Display 3 (Always) -> Backend 1 (Always)
        default:
          return displayValue;
      }
    }
  };

  const handleChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const notes = e.target.notes.value;
    setNotes(notes);
    const apiFunction = cookies?.root === 'teacher' ? updateTeacherDevelopmentalQuestionnarie : updateStudentDevelopmentalQuestionnarie;

    // Convert formData to the required format
    const answers = Object.entries(formData).map(([questionId, displayValue]) => {
      const question = results.data.questions.find(q => q.question_id.toString() === questionId);
      const backendValue = question ? convertDisplayToBackend(displayValue, question.score_type) : displayValue;

      return {
        student_id: parseInt(recordId),
        question_id: parseInt(questionId),
        answer: backendValue,
      };
    });

    const payload = {
      answers: answers,
      notes: notes,
    };
    try {
      const response = await apiFunction(JSON.stringify(payload));
      if (response.status === true) {
        toastMessage(response.message, 'success');
      } else {
        toastMessage(response.message, 'error');
      }
    } catch (err) {
      // console.error('Error updating nutritional questionnaire: ', err);
      toastMessage(err || `Error updating nutritional questionnaire: ${err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderRadioOptions = question => {
    const selectedValue = formData[question.question_id] || null;

    return (
      <div className="mt-[15px] flex items-center space-x-5">
        {/* Never */}
        <div className="flex items-center space-x-[18px]">
          <input
            id={`${question.question_id}-never`}
            name={`question_${question.question_id}`}
            value="1"
            type="radio"
            checked={selectedValue === '1'}
            onChange={() => handleChange(question.question_id, '1')}
            className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
          />
          <label htmlFor={`${question.question_id}-never`} className="ml-2 font-inter font-normal text-sm leading-6 tracking-normal text-[#464646]">
            Never
          </label>
        </div>

        {/* Sometimes */}
        <div className="flex items-center space-x-[18px]">
          <input
            id={`${question.question_id}-sometimes`}
            name={`question_${question.question_id}`}
            value="2"
            type="radio"
            checked={selectedValue === '2'}
            onChange={() => handleChange(question.question_id, '2')}
            className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
          />
          <label htmlFor={`${question.question_id}-sometimes`} className="ml-2 font-inter font-normal text-sm leading-6 tracking-normal text-[#464646]">
            Sometimes
          </label>
        </div>

        {/* Always */}
        <div className="flex items-center space-x-[18px]">
          <input
            id={`${question.question_id}-always`}
            name={`question_${question.question_id}`}
            value="3"
            type="radio"
            checked={selectedValue === '3'}
            onChange={() => handleChange(question.question_id, '3')}
            className="relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden"
          />
          <label htmlFor={`${question.question_id}-always`} className="ml-2 font-inter font-normal text-sm leading-6 tracking-normal text-[#464646]">
            Always
          </label>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full mx-auto py-8">
        <InlineSpinner />
      </div>
    );
  }

  return (
    <div className="w-full">
      <form method="PUT" onSubmit={handleSubmit}>
        <div className="border-b border-gray-900/10 pb-[30px]">
          {/* <h2 className="text-base/7 font-semibold text-[#000000] mb-[30px]">{tabName}</h2> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-[20px] gap-y-[40px] sm:gap-x-[25px] sm:gap-y-[50px] md:gap-x-[25px] md:gap-y-[50px] lg:gap-x-[30px] lg:gap-y-[70px]">
            {results.status === true ? (
              Object.keys(results.data?.questions).length > 0 ? (
                results.data.questions.map((questionItem, index) => (
                  <div key={questionItem.question_id} className="flex flex-col">
                    <p className="font-inter font-normal text-sm leading-6 tracking-normal text-[#000000] mb-2">
                      {index + 1}. {questionItem.question_text}
                    </p>
                    {renderRadioOptions(questionItem)}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-sm/6 text-center font-normal text-gray-500">No questions available</div>
              )
            ) : (
              <div className="col-span-full text-center text-gray-500">{results.message || 'Failed to load questions'}</div>
            )}
          </div>
        </div>

        <div className="mt-[50px] border-b border-gray-900/10 pb-[30px]">
          <label htmlFor="Notes" className="block text-sm/6 font-semibold text-gray-900">
            Notes
          </label>
          <div className="mt-2 p-5">
            <textarea
              id="notes"
              name="notes"
              placeholder="Add notes here"
              rows={4}
              defaultValue={notes ? notes : results.data?.notes}
              style={{ width: '80%' }}
              className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
          </div>
        </div>

        <div className="mt-[50px] mb-[50px] flex justify-center items-center gap-5">
          <button
            onClick={() => router.back()}
            type="button"
            className="font-normal w-[78px] h-[37px] py-2 px-5 border border-[#5465FF] rounded-[5px] whitespace-nowrap"
          >
            Close
          </button>
          <button
            type="submit"
            className="rounded-[5px] bg-indigo-500 w-[135px] h-[37px] px-5 py-2 text-sm font-normal text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
