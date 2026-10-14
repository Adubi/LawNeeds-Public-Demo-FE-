import { COLORS } from "@/constants/colors";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { Button } from "./Button";
import { SPACING } from "@/constants/theme";
import {useTranslation} from 'react-i18next';

interface CustomDatePickerProps {
  showDay?: boolean;
  showPresent?: boolean;
  onPresentSelected?: (date: string) => void;
  onDateSelected: (date: string) => void;
  setModalVisible: (visible: boolean) => void;
  isModalVisible: boolean;
  minAgeLimit?: number; // 👈 Add this
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  showDay = true,
  showPresent = false,
  onDateSelected,
  setModalVisible,
  onPresentSelected,
  isModalVisible, minAgeLimit,

}) => {

  const {t} = useTranslation();

  const [selectedDay, setSelectedDay] = useState<string>("01");
  const [selectedMonth, setSelectedMonth] = useState<string>("01");
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 100;
  const ageLimit = minAgeLimit ?? 0;
  const maxYear = currentYear - ageLimit;
  const maxAllowedYear = currentYear - ageLimit;
  const [selectedYear, setSelectedYear] = useState<number>(maxAllowedYear);
  // const [selectedYear, setSelectedYear] = useState<number>(
  //   new Date().getFullYear()
  // );

  const days: string[] = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const months: string[] = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  // const years: string[] = Array.from({ length: 100 }, (_, i) =>
  //   (new Date().getFullYear() - i).toString()
  // );

  const years: string[] = Array.from({ length: maxYear - minYear + 1 }, (_, i) =>
      (maxYear - i).toString()
  );

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleDateSelection = () => {
    const date = `${selectedYear}-${selectedMonth}-${selectedDay}`;
    onDateSelected(date);
    toggleModal();
  };

  const handlePresentSelection = () => {
    if (onPresentSelected) {
      onPresentSelected("Present");
    }
    toggleModal();
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={toggleModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('select_date')}</Text>
          <View style={styles.bottomDivider} />
          <View style={styles.pickerLabels}>
            {
                showDay &&
                <Text style={styles.labelText}>{t('day')}</Text>
            }
            <Text style={styles.labelText}>{t('month')}</Text>
            <Text style={styles.labelText}>{t('year')}</Text>
          </View>
          <View style={styles.pickerContainer}>
            {
              showDay &&
                <ScrollView style={styles.picker}>
                  {days.map((day, index) => (
                      <TouchableOpacity
                          key={index}
                          onPress={() => setSelectedDay(day)}
                          style={[
                            styles.pickerItem,
                            selectedDay === day && styles.selectedItem,
                          ]}
                      >
                        <Text style={styles.pickerText}>{day}</Text>
                      </TouchableOpacity>
                  ))}
                </ScrollView>
            }
            {
                showDay &&
                <View style={styles.divider}/>
            }
            <ScrollView style={styles.picker}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedMonth(month)}
                  style={[
                    styles.pickerItem,
                    selectedMonth === month && styles.selectedItem,
                  ]}
                >
                  <Text style={styles.pickerText}>{month}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.divider} />
            <ScrollView style={styles.picker}>
              {years.map((year, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedYear(Number(year))}
                  style={[
                    styles.pickerItem,
                    selectedYear.toString() === year && styles.selectedItem,
                  ]}
                >
                  <Text style={styles.pickerText}>{year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{flexDirection: 'row', gap: 10, marginTop: SPACING.md}}>
            <Button
                title={t('select_date')}
                onPress={handleDateSelection}
                variant="primary"
                style={{flex: 1}}
            />
            {
              showPresent &&
                <Button
                    title={t('present')}
                    onPress={handlePresentSelection}
                    variant="secondary"
                    style={{flex: 1}}
                />
            }
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.BackgroundColor,
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  title: {
    fontSize: RFValue(12),
    fontFamily: "InstrumentSansBold",
    marginBottom: 5,
  },
  pickerLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
  },
  labelText: {
    fontSize: RFValue(12),
    fontFamily: "InstrumentSansBold",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    flex: 1,
    height: 150,
  },
  pickerItem: {
    padding: 5,
    alignItems: "center",
  },
  selectedItem: {
    backgroundColor: "#d3d3d3",
    borderRadius: 5,
  },
  pickerText: {
    fontSize: RFValue(14),
    fontFamily: "InstrumentSansBold",
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#C0C0C0",
    marginHorizontal: 10,
  },
  bottomDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#C0C0C0",
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  closeButtonText: {
    color: "white",
    fontSize: RFValue(14),
    fontFamily: "InstrumentSansBold",
  },
});

export default CustomDatePicker;
