import { uniqueNamesGenerator, colors, animals, NumberDictionary } from 'unique-names-generator';

const numberDictionary = NumberDictionary.generate({ min: 100, max: 9999 });
const generateRandomUsername = () => {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals, numberDictionary],
    length: 3,
    separator: '',
    style: 'capital'
  });
};

export default generateRandomUsername;
