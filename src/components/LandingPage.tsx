import { useState } from 'react';
import styled from 'styled-components';
import { MapScope, ContinentName } from '../types';
import { CONTINENTS, COUNTRIES, getCountriesByContinent } from '../data/geography';

interface LandingPageProps {
  onScopeSelected: (scope: MapScope) => void;
}

const PageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f2f5;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  padding: 48px;
  max-width: 520px;
  width: 100%;
  margin: 20px;
`;

const Title = styled.h1`
  font-size: 32px;
  color: #1a1a2e;
  margin-bottom: 8px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 15px;
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.5;
`;

const TabRow = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: ${p => p.$active ? '#1a1a2e' : 'white'};
  color: ${p => p.$active ? 'white' : '#666'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.$active ? '#1a1a2e' : '#f5f5f5'};
  }

  &:not(:last-child) {
    border-right: 1px solid #ddd;
  }
`;

const SelectWrapper = styled.div`
  margin-bottom: 24px;
`;

const SelectLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  color: #333;
  background: white;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;

  &:focus {
    outline: none;
    border-color: #1a1a2e;
    box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.1);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  color: #333;
  margin-bottom: 8px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #1a1a2e;
    box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.1);
  }
`;

const ExploreButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #1a1a2e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #2d2d4e;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const Description = styled.p`
  color: #888;
  font-size: 13px;
  text-align: center;
  margin-bottom: 24px;
  min-height: 20px;
`;

type ScopeTab = 'world' | 'continent' | 'country';

export const LandingPage: React.FC<LandingPageProps> = ({ onScopeSelected }) => {
  const [activeTab, setActiveTab] = useState<ScopeTab>('world');
  const [selectedContinent, setSelectedContinent] = useState<ContinentName | ''>('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Group filtered countries by continent
  const groupedCountries = CONTINENTS
    .map(cont => ({
      continent: cont.name,
      countries: filteredCountries.filter(c => c.continent === cont.name),
    }))
    .filter(g => g.countries.length > 0);

  const canExplore = () => {
    if (activeTab === 'world') return true;
    if (activeTab === 'continent') return selectedContinent !== '';
    if (activeTab === 'country') return selectedCountryCode !== '';
    return false;
  };

  const getDescription = () => {
    switch (activeTab) {
      case 'world':
        return 'View the entire world map and mark countries you\'ve visited.';
      case 'continent':
        return selectedContinent
          ? `Explore ${selectedContinent} at country level.`
          : 'Select a continent to explore.';
      case 'country':
        const country = COUNTRIES.find(c => c.code === selectedCountryCode);
        return country
          ? `Explore ${country.name} at subdivision level.`
          : 'Search and select a country to view its subdivisions.';
    }
  };

  const handleExplore = () => {
    if (activeTab === 'world') {
      onScopeSelected({ type: 'world' });
    } else if (activeTab === 'continent' && selectedContinent) {
      onScopeSelected({ type: 'continent', continent: selectedContinent });
    } else if (activeTab === 'country' && selectedCountryCode) {
      const country = COUNTRIES.find(c => c.code === selectedCountryCode);
      if (country) {
        onScopeSelected({ type: 'country', countryCode: country.code, countryName: country.name });
      }
    }
  };

  return (
    <PageWrapper data-testid="landing-page">
      <Card>
        <Title>Travel Maps</Title>
        <Subtitle>Create your personal travel map. Choose a scope to get started.</Subtitle>

        <TabRow>
          <Tab $active={activeTab === 'world'} onClick={() => setActiveTab('world')}>
            World
          </Tab>
          <Tab $active={activeTab === 'continent'} onClick={() => setActiveTab('continent')}>
            Continent
          </Tab>
          <Tab $active={activeTab === 'country'} onClick={() => setActiveTab('country')}>
            Country
          </Tab>
        </TabRow>

        <Description>{getDescription()}</Description>

        {activeTab === 'continent' && (
          <SelectWrapper>
            <SelectLabel>Continent</SelectLabel>
            <Select
              value={selectedContinent}
              onChange={e => setSelectedContinent(e.target.value as ContinentName | '')}
            >
              <option value="">Choose a continent...</option>
              {CONTINENTS.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </Select>
          </SelectWrapper>
        )}

        {activeTab === 'country' && (
          <SelectWrapper>
            <SelectLabel>Country</SelectLabel>
            <SearchInput
              type="text"
              placeholder="Search countries..."
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
            />
            <Select
              value={selectedCountryCode}
              onChange={e => setSelectedCountryCode(e.target.value)}
            >
              <option value="">Choose a country...</option>
              {groupedCountries.map(g => (
                <optgroup key={g.continent} label={g.continent}>
                  {g.countries.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </SelectWrapper>
        )}

        <ExploreButton onClick={handleExplore} disabled={!canExplore()}>
          Explore
        </ExploreButton>
      </Card>
    </PageWrapper>
  );
};
